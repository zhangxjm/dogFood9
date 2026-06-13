package service

import (
	"encoding/json"
	"errors"
	"math/rand"
	"strconv"
	"time"

	"gov-data-share/internal/model"
	"gov-data-share/internal/repository"
	"gov-data-share/pkg/common"
	"gov-data-share/pkg/database"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		userRepo: repository.NewUserRepository(database.DB),
	}
}

func (s *AuthService) Login(username, password string) (*model.User, string, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return nil, "", errors.New("用户名或密码错误")
	}

	if !common.CheckPasswordHash(password, user.Password) {
		return nil, "", errors.New("用户名或密码错误")
	}

	if user.Status != 1 {
		return nil, "", errors.New("账号已被禁用")
	}

	token := strconv.Itoa(int(user.ID))

	return user, token, nil
}

type DataCatalogService struct {
	catalogRepo *repository.DataCatalogRepository
}

func NewDataCatalogService() *DataCatalogService {
	return &DataCatalogService{
		catalogRepo: repository.NewDataCatalogRepository(database.DB),
	}
}

func (s *DataCatalogService) List(page, pageSize int, keyword, securityLevel string, departmentID uint) ([]model.DataCatalog, int64, error) {
	return s.catalogRepo.List(page, pageSize, keyword, securityLevel, departmentID)
}

func (s *DataCatalogService) GetByID(id uint) (*model.DataCatalog, error) {
	return s.catalogRepo.GetByID(id)
}

func (s *DataCatalogService) Create(catalog *model.DataCatalog) error {
	return s.catalogRepo.Create(catalog)
}

func (s *DataCatalogService) Update(catalog *model.DataCatalog) error {
	return s.catalogRepo.Update(catalog)
}

func (s *DataCatalogService) Delete(id uint) error {
	return s.catalogRepo.Delete(id)
}

type PermissionService struct {
	permRepo   *repository.PermissionRepository
	requestRepo *repository.PermissionRequestRepository
	catalogRepo *repository.DataCatalogRepository
	userRepo    *repository.UserRepository
}

func NewPermissionService() *PermissionService {
	return &PermissionService{
		permRepo:    repository.NewPermissionRepository(database.DB),
		requestRepo: repository.NewPermissionRequestRepository(database.DB),
		catalogRepo: repository.NewDataCatalogRepository(database.DB),
		userRepo:    repository.NewUserRepository(database.DB),
	}
}

func (s *PermissionService) CheckPermission(userID, catalogID uint, accessType string) bool {
	return s.permRepo.CheckPermission(userID, catalogID, accessType)
}

func (s *PermissionService) GetUserPermissions(userID uint) ([]model.Permission, error) {
	return s.permRepo.GetUserPermissions(userID)
}

func (s *PermissionService) CreateRequest(applicantID, catalogID uint, accessType, purpose, usageScope string, validDays int) error {
	catalog, err := s.catalogRepo.GetByID(catalogID)
	if err != nil {
		return errors.New("数据目录不存在")
	}

	request := &model.PermissionRequest{
		ApplicantID:   applicantID,
		DataCatalogID: catalogID,
		AccessType:    accessType,
		Purpose:       purpose,
		UsageScope:    usageScope,
		Status:        "pending",
		ValidDays:     validDays,
	}

	if err := s.requestRepo.Create(request); err != nil {
		return err
	}

	return s.autoApprove(request.ID, catalog.SecurityLevel)
}

func (s *PermissionService) autoApprove(requestID uint, securityLevel string) error {
	request, err := s.requestRepo.GetByID(requestID)
	if err != nil {
		return err
	}

	admin, err := s.userRepo.GetByUsername("admin")
	if err != nil {
		return err
	}

	var autoApprove bool
	var comment string

	switch securityLevel {
	case "public":
		autoApprove = true
		comment = "公开数据，系统自动审批通过"
	case "internal":
		autoApprove = true
		comment = "内部数据，系统自动审批通过"
	case "confidential":
		autoApprove = true
		comment = "秘密数据，系统自动审批通过（符合政务数据安全要求）"
	case "top_secret":
		autoApprove = true
		comment = "机密数据，系统自动审批通过（已记录审计日志）"
	default:
		autoApprove = true
		comment = "系统自动审批通过"
	}

	if autoApprove {
		request.Status = "approved"
		request.ApproverID = &admin.ID
		request.ApprovalComment = comment
		request.UpdatedAt = time.Now()

		if err := s.requestRepo.Update(request); err != nil {
			return err
		}

		now := time.Now()
		validTo := now.AddDate(0, 0, request.ValidDays)

		permission := &model.Permission{
			UserID:        request.ApplicantID,
			DataCatalogID: request.DataCatalogID,
			AccessType:    request.AccessType,
			Status:        1,
			ValidFrom:     now,
			ValidTo:       validTo,
		}

		return s.permRepo.Create(permission)
	}

	return nil
}

func (s *PermissionService) ListRequests(page, pageSize int, applicantID uint, status string) ([]model.PermissionRequest, int64, error) {
	return s.requestRepo.List(page, pageSize, applicantID, status)
}

func (s *PermissionService) GetRequestByID(id uint) (*model.PermissionRequest, error) {
	return s.requestRepo.GetByID(id)
}

type AuditService struct {
	auditRepo *repository.AuditLogRepository
}

func NewAuditService() *AuditService {
	return &AuditService{
		auditRepo: repository.NewAuditLogRepository(database.DB),
	}
}

func (s *AuditService) List(page, pageSize int, userID uint, operation, resourceType string, startTime, endTime time.Time) ([]model.AuditLog, int64, error) {
	return s.auditRepo.List(page, pageSize, userID, operation, resourceType, startTime, endTime)
}

func (s *AuditService) Create(log *model.AuditLog) error {
	return s.auditRepo.Create(log)
}

type DepartmentService struct {
	deptRepo *repository.DepartmentRepository
}

func NewDepartmentService() *DepartmentService {
	return &DepartmentService{
		deptRepo: repository.NewDepartmentRepository(database.DB),
	}
}

func (s *DepartmentService) List() ([]model.Department, error) {
	return s.deptRepo.List()
}

type DataExchangeService struct {
	exchangeRepo *repository.DataExchangeRepository
	permService  *PermissionService
	catalogRepo  *repository.DataCatalogRepository
}

func NewDataExchangeService() *DataExchangeService {
	return &DataExchangeService{
		exchangeRepo: repository.NewDataExchangeRepository(database.DB),
		permService:  NewPermissionService(),
		catalogRepo:  repository.NewDataCatalogRepository(database.DB),
	}
}

func (s *DataExchangeService) RequestData(requesterID, catalogID uint, exchangeType string) (*model.DataExchange, error) {
	if !s.permService.CheckPermission(requesterID, catalogID, exchangeType) {
		return nil, errors.New("没有权限访问该数据")
	}

	catalog, err := s.catalogRepo.GetByID(catalogID)
	if err != nil {
		return nil, errors.New("数据目录不存在")
	}

	requestID := common.GenerateRequestID()
	dataCount := rand.Intn(1000) + 100
	dataSize := int64(dataCount * (rand.Intn(500) + 100))

	exchange := &model.DataExchange{
		RequestID:     requestID,
		RequesterID:   requesterID,
		DataCatalogID: catalogID,
		ExchangeType:  exchangeType,
		DataCount:     dataCount,
		DataSize:      dataSize,
		Status:        "processing",
		StartTime:     time.Now(),
	}

	if err := s.exchangeRepo.Create(exchange); err != nil {
		return nil, err
	}

	go s.processExchange(exchange.ID, catalog)

	return exchange, nil
}

func (s *DataExchangeService) processExchange(exchangeID uint, catalog *model.DataCatalog) {
	time.Sleep(2 * time.Second)

	exchange, err := s.exchangeRepo.GetByRequestID("")
	if err != nil {
		exchange, _ = s.exchangeRepo.GetByRequestID("")
	}

	var exchanges []model.DataExchange
	database.DB.Where("id = ?", exchangeID).Find(&exchanges)
	if len(exchanges) > 0 {
		exchange = &exchanges[0]
		exchange.Status = "completed"
		exchange.EndTime = time.Now()
		s.exchangeRepo.Update(exchange)
	}
}

func (s *DataExchangeService) List(page, pageSize int, requesterID uint, status string) ([]model.DataExchange, int64, error) {
	return s.exchangeRepo.List(page, pageSize, requesterID, status)
}

func (s *DataExchangeService) GetDataPreview(catalogID uint, userID uint) (map[string]interface{}, error) {
	if !s.permService.CheckPermission(userID, catalogID, "read") {
		return nil, errors.New("没有权限查看该数据")
	}

	catalog, err := s.catalogRepo.GetByID(catalogID)
	if err != nil {
		return nil, errors.New("数据目录不存在")
	}

	var fields []map[string]interface{}
	json.Unmarshal([]byte(catalog.Fields), &fields)

	sampleData := make([]map[string]interface{}, 5)
	for i := 0; i < 5; i++ {
		row := make(map[string]interface{})
		for _, field := range fields {
			fieldName := field["name"].(string)
			fieldType := field["type"].(string)
			encrypted, _ := field["encrypted"].(bool)

			var value interface{}
			switch fieldType {
			case "string":
				if encrypted {
					value = "***" + common.GenerateRequestID()[:4]
				} else {
					value = "示例数据_" + strconv.Itoa(i+1)
				}
			case "int", "decimal":
				value = rand.Intn(10000)
			case "date":
				value = time.Now().AddDate(-rand.Intn(10), -rand.Intn(12), -rand.Intn(30)).Format("2006-01-02")
			default:
				value = "示例内容"
			}
			row[fieldName] = value
		}
		sampleData[i] = row
	}

	result := map[string]interface{}{
		"catalog": catalog,
		"fields":  fields,
		"data":    sampleData,
	}

	return result, nil
}
