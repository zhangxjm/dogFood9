package model

import (
	"time"

	"gorm.io/gorm"
)

type Department struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null;unique" json:"name"`
	Code        string         `gorm:"size:50;not null;unique" json:"code"`
	Description string         `gorm:"size:500" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"size:50;not null;unique" json:"username"`
	Password     string         `gorm:"size:255;not null" json:"-"`
	RealName     string         `gorm:"size:50;not null" json:"real_name"`
	DepartmentID uint           `json:"department_id"`
	Department   Department     `gorm:"foreignKey:DepartmentID" json:"department"`
	Role         string         `gorm:"size:20;not null;default:'user'" json:"role"`
	Status       int            `gorm:"not null;default:1" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type DataCatalog struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Name            string         `gorm:"size:200;not null" json:"name"`
	Code            string         `gorm:"size:100;not null;unique" json:"code"`
	Description     string         `gorm:"size:1000" json:"description"`
	DataStandard    string         `gorm:"type:text" json:"data_standard"`
	DataFormat      string         `gorm:"size:50" json:"data_format"`
	UpdateFrequency string         `gorm:"size:50" json:"update_frequency"`
	SourceSystem    string         `gorm:"size:100" json:"source_system"`
	DataOwnerID     uint           `json:"data_owner_id"`
	DataOwner       Department     `gorm:"foreignKey:DataOwnerID" json:"data_owner"`
	SecurityLevel   string         `gorm:"size:20;not null;default:'internal'" json:"security_level"`
	Status          int            `gorm:"not null;default:1" json:"status"`
	Fields          string         `gorm:"type:text" json:"fields"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type Permission struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user"`
	DataCatalogID uint          `json:"data_catalog_id"`
	DataCatalog  DataCatalog    `gorm:"foreignKey:DataCatalogID" json:"data_catalog"`
	AccessType   string         `gorm:"size:20;not null;default:'read'" json:"access_type"`
	Status       int            `gorm:"not null;default:1" json:"status"`
	ValidFrom    time.Time      `json:"valid_from"`
	ValidTo      time.Time      `json:"valid_to"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type PermissionRequest struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ApplicantID     uint           `json:"applicant_id"`
	Applicant       User           `gorm:"foreignKey:ApplicantID" json:"applicant"`
	DataCatalogID   uint           `json:"data_catalog_id"`
	DataCatalog     DataCatalog    `gorm:"foreignKey:DataCatalogID" json:"data_catalog"`
	AccessType      string         `gorm:"size:20;not null;default:'read'" json:"access_type"`
	Purpose         string         `gorm:"size:500;not null" json:"purpose"`
	UsageScope      string         `gorm:"size:500" json:"usage_scope"`
	Status          string         `gorm:"size:20;not null;default:'pending'" json:"status"`
	ApproverID      *uint          `json:"approver_id"`
	Approver        *User          `gorm:"foreignKey:ApproverID" json:"approver"`
	ApprovalComment string         `gorm:"size:500" json:"approval_comment"`
	ValidDays       int            `gorm:"not null;default:365" json:"valid_days"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type AuditLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"user_id"`
	Username      string    `gorm:"size:50" json:"username"`
	RealName      string    `gorm:"size:50" json:"real_name"`
	DepartmentID  uint      `json:"department_id"`
	Operation     string    `gorm:"size:50;not null" json:"operation"`
	ResourceType  string    `gorm:"size:50;not null" json:"resource_type"`
	ResourceID    uint      `json:"resource_id"`
	ResourceName  string    `gorm:"size:200" json:"resource_name"`
	Detail        string    `gorm:"type:text" json:"detail"`
	IPAddress     string    `gorm:"size:50" json:"ip_address"`
	UserAgent     string    `gorm:"size:500" json:"user_agent"`
	OperationTime time.Time `gorm:"not null" json:"operation_time"`
	Success       bool      `gorm:"not null;default:true" json:"success"`
}

type DataExchange struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	RequestID        string         `gorm:"size:64;unique" json:"request_id"`
	RequesterID      uint           `json:"requester_id"`
	Requester        User           `gorm:"foreignKey:RequesterID" json:"requester"`
	DataCatalogID    uint           `json:"data_catalog_id"`
	DataCatalog      DataCatalog    `gorm:"foreignKey:DataCatalogID" json:"data_catalog"`
	ExchangeType     string         `gorm:"size:20;not null" json:"exchange_type"`
	DataCount        int            `json:"data_count"`
	DataSize         int64          `json:"data_size"`
	Status           string         `gorm:"size:20;not null;default:'processing'" json:"status"`
	ErrorCode        string         `gorm:"size:50" json:"error_code"`
	ErrorMessage     string         `gorm:"size:500" json:"error_message"`
	StartTime        time.Time      `json:"start_time"`
	EndTime          time.Time      `json:"end_time"`
	CreatedAt        time.Time      `json:"created_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}
