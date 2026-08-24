package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/models"
	"backend/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TodoHandler struct {
	repo repositories.TodoRepository
}

func NewTodoHandler(db *gorm.DB) *TodoHandler {
	return &TodoHandler{
		repo: repositories.NewTodoRepository(db),
	}
}

func (h *TodoHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *TodoHandler) ListItems(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	todos, total, err := h.repo.List(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch todos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":    todos,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func (h *TodoHandler) CreateItem(c *gin.Context) {
	var input models.CreateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title must not be blank"})
		return
	}

	newTodo := models.Todo{
		ID:    uuid.New(),
		Title: title,
	}
	if err := h.repo.Create(&newTodo); err != nil {
		if errors.Is(err, repositories.ErrDuplicateTitle) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, newTodo)
}

func (h *TodoHandler) GetItem(c *gin.Context) {
	id := c.Param("id")

	item, err := h.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch todo"})
		}
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *TodoHandler) UpdateItem(c *gin.Context) {
	id := c.Param("id")

	var input models.UpdateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title != nil {
		trimmed := strings.TrimSpace(*input.Title)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title must not be blank"})
			return
		}
		input.Title = &trimmed
	}

	updated, err := h.repo.Update(id, input)
	if err != nil {
		switch {
		case errors.Is(err, repositories.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
		case errors.Is(err, repositories.ErrDuplicateTitle):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *TodoHandler) DeleteItem(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id format"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete todo"})
		}
		return
	}
	c.Status(http.StatusNoContent)
}
