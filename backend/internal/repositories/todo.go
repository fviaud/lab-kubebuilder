package repositories

import (
	"errors"

	"backend/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// Sentinel errors returned by TodoRepository. Handlers should compare
// against these (via errors.Is) instead of inspecting GORM/Postgres
// internals, keeping database specifics fully encapsulated here.
var (
	ErrNotFound       = errors.New("todo not found")
	ErrDuplicateTitle = errors.New("a todo with this title already exists")
)

const pgUniqueViolationCode = "23505"

// TodoRepository defines the data-access operations for Todo, decoupling
// HTTP handlers from GORM/SQL specifics and allowing them to be unit tested
// against a fake/mock implementation.
type TodoRepository interface {
	List(page, pageSize int) (items []models.Todo, total int64, err error)
	Create(todo *models.Todo) error
	GetByID(id string) (*models.Todo, error)
	Update(id string, input models.UpdateTodoInput) (*models.Todo, error)
	Delete(id string) error
}

type todoRepository struct {
	db *gorm.DB
}

func NewTodoRepository(db *gorm.DB) TodoRepository {
	return &todoRepository{db: db}
}

func (r *todoRepository) List(page, pageSize int) ([]models.Todo, int64, error) {
	var todos []models.Todo
	var total int64

	if err := r.db.Model(&models.Todo{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := r.db.
		Limit(pageSize).
		Offset(offset).
		Order("created_at desc").
		Find(&todos).Error; err != nil {
		return nil, 0, err
	}

	return todos, total, nil
}

func (r *todoRepository) Create(todo *models.Todo) error {
	if err := r.db.Create(todo).Error; err != nil {
		if isUniqueViolation(err) {
			return ErrDuplicateTitle
		}
		return err
	}
	return nil
}

func (r *todoRepository) GetByID(id string) (*models.Todo, error) {
	var todo models.Todo
	if err := r.db.First(&todo, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &todo, nil
}

func (r *todoRepository) Update(id string, input models.UpdateTodoInput) (*models.Todo, error) {
	result := r.db.Model(&models.Todo{}).Where("id = ?", id).Updates(input)
	if result.Error != nil {
		if isUniqueViolation(result.Error) {
			return nil, ErrDuplicateTitle
		}
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, ErrNotFound
	}
	return r.GetByID(id)
}

func (r *todoRepository) Delete(id string) error {
	result := r.db.Delete(&models.Todo{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// isUniqueViolation reports whether err is a Postgres unique constraint
// violation. With the pgx driver, GORM's own gorm.ErrDuplicatedKey sentinel
// is never returned, so we must inspect the underlying *pgconn.PgError code.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolationCode
}
