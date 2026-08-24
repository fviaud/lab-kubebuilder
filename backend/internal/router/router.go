package router

import (
	"backend/internal/handler"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func New(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	t := handler.NewTodoHandler(db)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", t.Health)
		v1.GET("/todos", t.ListItems)
		v1.POST("/todos", t.CreateItem)
		v1.GET("/todos/:id", t.GetItem)
		v1.PUT("/todos/:id", t.UpdateItem)
		v1.DELETE("/todos/:id", t.DeleteItem)
	}
	return r
}
