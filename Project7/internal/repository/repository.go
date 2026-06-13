package repository

import (
	"time"

	"gorm.io/gorm"

	"gov-data-share/internal/model"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Department").Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Department").First(&user, id).Error
	return &user, err
}

func (r *UserRepository) List(page, pageSize int, keyword string) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := r.db.Model(&model.User{}).Preload("Department")
	if keyword != "" {
		query = query.Where("username LIKE ? OR real_name LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Find(&users).Error
	return users, total, err
}

type DataCatalogRepository struct {
	db *gorm.DB
}

func NewDataCatalogRepository(db *gorm.DB) *DataCatalogRepository {
	return &DataCatalogRepository{db: db}
}

func (r *DataCatalogRepository) List(page, pageSize int, keyword, securityLevel string, departmentID uint) ([]model.DataCatalog, int64, error) {
	var catalogs []model.DataCatalog
	var total int64

	query := r.db.Model(&model.DataCatalog{}).Preload("DataOwner")
	if keyword != "" {
		query = query.Where("name LIKE ? OR code LIKE ? OR description LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if securityLevel != "" {
		query = query.Where("security_level = ?", securityLevel)
	}
	if departmentID > 0 {
		query = query.Where("data_owner_id = ?", departmentID)
	}

	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&catalogs).Error
	return catalogs, total, err
}

func (r *DataCatalogRepository) GetByID(id uint) (*model.DataCatalog, error) {
	var catalog model.DataCatalog
	err := r.db.Preload("DataOwner").First(&catalog, id).Error
	return &catalog, err
}

func (r *DataCatalogRepository) Create(catalog *model.DataCatalog) error {
	return r.db.Create(catalog).Error
}

func (r *DataCatalogRepository) Update(catalog *model.DataCatalog) error {
	return r.db.Save(catalog).Error
}

func (r *DataCatalogRepository) Delete(id uint) error {
	return r.db.Delete(&model.DataCatalog{}, id).Error
}

type PermissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) CheckPermission(userID, catalogID uint, accessType string) bool {
	var count int64
	now := time.Now()
	r.db.Model(&model.Permission{}).Where(
		"user_id = ? AND data_catalog_id = ? AND access_type = ? AND status = 1 AND valid_from <= ? AND valid_to >= ?",
		userID, catalogID, accessType, now, now,
	).Count(&count)
	return count > 0
}

func (r *PermissionRepository) GetUserPermissions(userID uint) ([]model.Permission, error) {
	var permissions []model.Permission
	err := r.db.Preload("DataCatalog").Preload("DataCatalog.DataOwner").
		Where("user_id = ? AND status = 1", userID).Find(&permissions).Error
	return permissions, err
}

func (r *PermissionRepository) Create(permission *model.Permission) error {
	return r.db.Create(permission).Error
}

type PermissionRequestRepository struct {
	db *gorm.DB
}

func NewPermissionRequestRepository(db *gorm.DB) *PermissionRequestRepository {
	return &PermissionRequestRepository{db: db}
}

func (r *PermissionRequestRepository) List(page, pageSize int, applicantID uint, status string) ([]model.PermissionRequest, int64, error) {
	var requests []model.PermissionRequest
	var total int64

	query := r.db.Model(&model.PermissionRequest{}).Preload("Applicant").Preload("Applicant.Department").
		Preload("DataCatalog").Preload("Approver")

	if applicantID > 0 {
		query = query.Where("applicant_id = ?", applicantID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&requests).Error
	return requests, total, err
}

func (r *PermissionRequestRepository) GetByID(id uint) (*model.PermissionRequest, error) {
	var request model.PermissionRequest
	err := r.db.Preload("Applicant").Preload("DataCatalog").Preload("Approver").First(&request, id).Error
	return &request, err
}

func (r *PermissionRequestRepository) Create(request *model.PermissionRequest) error {
	return r.db.Create(request).Error
}

func (r *PermissionRequestRepository) Update(request *model.PermissionRequest) error {
	return r.db.Save(request).Error
}

type AuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) List(page, pageSize int, userID uint, operation, resourceType string, startTime, endTime time.Time) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64

	query := r.db.Model(&model.AuditLog{})
	if userID > 0 {
		query = query.Where("user_id = ?", userID)
	}
	if operation != "" {
		query = query.Where("operation = ?", operation)
	}
	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}
	if !startTime.IsZero() {
		query = query.Where("operation_time >= ?", startTime)
	}
	if !endTime.IsZero() {
		query = query.Where("operation_time <= ?", endTime)
	}

	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Order("operation_time DESC").Find(&logs).Error
	return logs, total, err
}

func (r *AuditLogRepository) Create(log *model.AuditLog) error {
	return r.db.Create(log).Error
}

type DepartmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) *DepartmentRepository {
	return &DepartmentRepository{db: db}
}

func (r *DepartmentRepository) List() ([]model.Department, error) {
	var departments []model.Department
	err := r.db.Order("id ASC").Find(&departments).Error
	return departments, err
}

func (r *DepartmentRepository) GetByID(id uint) (*model.Department, error) {
	var dept model.Department
	err := r.db.First(&dept, id).Error
	return &dept, err
}

type DataExchangeRepository struct {
	db *gorm.DB
}

func NewDataExchangeRepository(db *gorm.DB) *DataExchangeRepository {
	return &DataExchangeRepository{db: db}
}

func (r *DataExchangeRepository) List(page, pageSize int, requesterID uint, status string) ([]model.DataExchange, int64, error) {
	var exchanges []model.DataExchange
	var total int64

	query := r.db.Model(&model.DataExchange{}).Preload("Requester").Preload("Requester.Department").
		Preload("DataCatalog")

	if requesterID > 0 {
		query = query.Where("requester_id = ?", requesterID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	offset := (page - 1) * pageSize
	err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&exchanges).Error
	return exchanges, total, err
}

func (r *DataExchangeRepository) Create(exchange *model.DataExchange) error {
	return r.db.Create(exchange).Error
}

func (r *DataExchangeRepository) Update(exchange *model.DataExchange) error {
	return r.db.Save(exchange).Error
}

func (r *DataExchangeRepository) GetByRequestID(requestID string) (*model.DataExchange, error) {
	var exchange model.DataExchange
	err := r.db.Where("request_id = ?", requestID).First(&exchange).Error
	return &exchange, err
}
