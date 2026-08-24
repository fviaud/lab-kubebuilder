package models

import (
	"time"

	"github.com/google/uuid"
)

type Todo struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Title     string    `json:"title" gorm:"uniqueIndex;not null"`
	Completed bool      `json:"completed" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type CreateTodoInput struct {
	Title string `json:"title" binding:"required,min=1,max=255"`
}

type UpdateTodoInput struct {
	Title     *string `json:"title" binding:"omitempty,min=1,max=255"`
	Completed *bool   `json:"completed"`
}
