package database

import (
	"encoding/json"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"

	"gov-data-share/internal/model"
)

func InitSeedData() error {
	log.Println("Starting seed data initialization...")

	if err := initDepartments(); err != nil {
		return err
	}

	if err := initUsers(); err != nil {
		return err
	}

	if err := initDataCatalogs(); err != nil {
		return err
	}

	if err := initPermissions(); err != nil {
		return err
	}

	log.Println("Seed data initialization completed successfully!")
	return nil
}

func initDepartments() error {
	var count int64
	DB.Model(&model.Department{}).Count(&count)
	if count > 0 {
		log.Println("Departments already exist, skipping...")
		return nil
	}

	departments := []model.Department{
		{Name: "政务服务办公室", Code: "GOV_SERVICE", Description: "负责政务服务综合管理"},
		{Name: "公安局", Code: "POLICE", Description: "公安系统数据管理部门"},
		{Name: "民政局", Code: "CIVIL_AFFAIRS", Description: "民政事务管理部门"},
		{Name: "人力资源和社会保障局", Code: "HRSS", Description: "人力资源和社会保障管理"},
		{Name: "卫生健康委员会", Code: "HEALTH", Description: "卫生健康管理部门"},
		{Name: "教育局", Code: "EDUCATION", Description: "教育事务管理部门"},
		{Name: "住房和城乡建设局", Code: "HOUSING", Description: "住房和城乡建设管理"},
		{Name: "市场监督管理局", Code: "MARKET_REG", Description: "市场监督管理部门"},
		{Name: "税务局", Code: "TAX", Description: "税务管理部门"},
		{Name: "数据管理局", Code: "DATA_ADMIN", Description: "政务数据综合管理部门"},
	}

	for _, dept := range departments {
		if err := DB.Create(&dept).Error; err != nil {
			return err
		}
	}

	log.Println("Departments initialized successfully")
	return nil
}

func initUsers() error {
	var count int64
	DB.Model(&model.User{}).Count(&count)
	if count > 0 {
		log.Println("Users already exist, skipping...")
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	users := []model.User{
		{Username: "admin", Password: string(hashedPassword), RealName: "系统管理员", DepartmentID: 10, Role: "admin", Status: 1},
		{Username: "police_user", Password: string(hashedPassword), RealName: "公安用户", DepartmentID: 2, Role: "user", Status: 1},
		{Username: "civil_user", Password: string(hashedPassword), RealName: "民政用户", DepartmentID: 3, Role: "user", Status: 1},
		{Username: "hrss_user", Password: string(hashedPassword), RealName: "人社用户", DepartmentID: 4, Role: "user", Status: 1},
		{Username: "health_user", Password: string(hashedPassword), RealName: "卫健用户", DepartmentID: 5, Role: "user", Status: 1},
		{Username: "audit_user", Password: string(hashedPassword), RealName: "审计员", DepartmentID: 10, Role: "auditor", Status: 1},
	}

	for _, user := range users {
		if err := DB.Create(&user).Error; err != nil {
			return err
		}
	}

	log.Println("Users initialized successfully")
	return nil
}

func initDataCatalogs() error {
	var count int64
	DB.Model(&model.DataCatalog{}).Count(&count)
	if count > 0 {
		log.Println("Data catalogs already exist, skipping...")
		return nil
	}

	fields1, _ := json.Marshal([]map[string]interface{}{
		{"name": "id_card", "label": "身份证号", "type": "string", "encrypted": true},
		{"name": "name", "label": "姓名", "type": "string"},
		{"name": "gender", "label": "性别", "type": "string"},
		{"name": "birth_date", "label": "出生日期", "type": "date"},
		{"name": "address", "label": "户籍地址", "type": "string"},
	})

	fields2, _ := json.Marshal([]map[string]interface{}{
		{"name": "id_card", "label": "身份证号", "type": "string", "encrypted": true},
		{"name": "name", "label": "姓名", "type": "string"},
		{"name": "marital_status", "label": "婚姻状况", "type": "string"},
		{"name": "spouse_name", "label": "配偶姓名", "type": "string"},
		{"name": "marriage_date", "label": "结婚日期", "type": "date"},
	})

	fields3, _ := json.Marshal([]map[string]interface{}{
		{"name": "id_card", "label": "身份证号", "type": "string", "encrypted": true},
		{"name": "name", "label": "姓名", "type": "string"},
		{"name": "social_security_no", "label": "社保编号", "type": "string"},
		{"name": "employment_status", "label": "就业状态", "type": "string"},
		{"name": "company_name", "label": "工作单位", "type": "string"},
		{"name": "insurance_base", "label": "缴费基数", "type": "decimal"},
	})

	fields4, _ := json.Marshal([]map[string]interface{}{
		{"name": "id_card", "label": "身份证号", "type": "string", "encrypted": true},
		{"name": "name", "label": "姓名", "type": "string"},
		{"name": "medical_card_no", "label": "医保卡号", "type": "string"},
		{"name": "insurance_type", "label": "保险类型", "type": "string"},
		{"name": "hospital_records", "label": "就医记录", "type": "text"},
	})

	fields5, _ := json.Marshal([]map[string]interface{}{
		{"name": "id_card", "label": "身份证号", "type": "string", "encrypted": true},
		{"name": "name", "label": "姓名", "type": "string"},
		{"name": "education_level", "label": "学历", "type": "string"},
		{"name": "school_name", "label": "毕业院校", "type": "string"},
		{"name": "graduation_date", "label": "毕业日期", "type": "date"},
		{"name": "degree", "label": "学位", "type": "string"},
	})

	fields6, _ := json.Marshal([]map[string]interface{}{
		{"name": "property_id", "label": "不动产编号", "type": "string"},
		{"name": "owner_name", "label": "权利人姓名", "type": "string"},
		{"name": "owner_id_card", "label": "权利人身份证", "type": "string", "encrypted": true},
		{"name": "property_address", "label": "房产地址", "type": "string"},
		{"name": "property_area", "label": "建筑面积", "type": "decimal"},
		{"name": "property_type", "label": "房屋性质", "type": "string"},
	})

	fields7, _ := json.Marshal([]map[string]interface{}{
		{"name": "business_license_no", "label": "营业执照号", "type": "string"},
		{"name": "company_name", "label": "企业名称", "type": "string"},
		{"name": "legal_representative", "label": "法定代表人", "type": "string"},
		{"name": "registered_capital", "label": "注册资本", "type": "decimal"},
		{"name": "business_scope", "label": "经营范围", "type": "text"},
		{"name": "registration_date", "label": "注册日期", "type": "date"},
	})

	fields8, _ := json.Marshal([]map[string]interface{}{
		{"name": "taxpayer_id", "label": "纳税人识别号", "type": "string"},
		{"name": "taxpayer_name", "label": "纳税人名称", "type": "string"},
		{"name": "tax_type", "label": "税种", "type": "string"},
		{"name": "taxable_amount", "label": "应纳税额", "type": "decimal"},
		{"name": "tax_paid", "label": "已缴税额", "type": "decimal"},
		{"name": "tax_period", "label": "所属期", "type": "string"},
	})

	catalogs := []model.DataCatalog{
		{
			Name: "常住人口基本信息", Code: "POPULATION_BASE",
			Description: "全市常住人口的基本身份信息，包括身份证号、姓名、性别、出生日期、户籍地址等",
			DataStandard: "GB/T 2261.1-2003 个人基本信息分类与代码",
			DataFormat: "JSON", UpdateFrequency: "实时", SourceSystem: "公安人口管理系统",
			DataOwnerID: 2, SecurityLevel: "confidential", Status: 1,
			Fields: string(fields1),
		},
		{
			Name: "婚姻登记信息", Code: "MARRIAGE_REG",
			Description: "公民婚姻登记信息，包括结婚、离婚等登记记录",
			DataStandard: "MZ/T 012-2016 民政业务数据元",
			DataFormat: "JSON", UpdateFrequency: "每日", SourceSystem: "民政婚姻登记系统",
			DataOwnerID: 3, SecurityLevel: "confidential", Status: 1,
			Fields: string(fields2),
		},
		{
			Name: "社会保险参保信息", Code: "SOCIAL_INSURANCE",
			Description: "职工和居民社会保险参保缴费信息，包括养老、医疗、失业、工伤、生育保险",
			DataStandard: "LD/T 30-2021 社会保险信息数据标准",
			DataFormat: "JSON", UpdateFrequency: "每日", SourceSystem: "社保核心平台",
			DataOwnerID: 4, SecurityLevel: "confidential", Status: 1,
			Fields: string(fields3),
		},
		{
			Name: "医疗卫生服务信息", Code: "HEALTH_SERVICE",
			Description: "居民健康档案、就医记录、医保结算等医疗卫生服务信息",
			DataStandard: "WS/T 500-2016 电子病历共享文档规范",
			DataFormat: "JSON", UpdateFrequency: "实时", SourceSystem: "区域卫生信息平台",
			DataOwnerID: 5, SecurityLevel: "top_secret", Status: 1,
			Fields: string(fields4),
		},
		{
			Name: "教育学历信息", Code: "EDUCATION_INFO",
			Description: "公民教育经历、学历学位等信息",
			DataStandard: "JY/T 1001-2015 教育管理信息 教育基础信息代码",
			DataFormat: "JSON", UpdateFrequency: "每月", SourceSystem: "教育管理公共服务平台",
			DataOwnerID: 6, SecurityLevel: "internal", Status: 1,
			Fields: string(fields5),
		},
		{
			Name: "不动产登记信息", Code: "REAL_ESTATE",
			Description: "土地、房屋等不动产登记信息，包括所有权、抵押权等",
			DataStandard: "TD/T 1054-2019 不动产登记数据标准",
			DataFormat: "JSON", UpdateFrequency: "实时", SourceSystem: "不动产登记信息管理基础平台",
			DataOwnerID: 7, SecurityLevel: "confidential", Status: 1,
			Fields: string(fields6),
		},
		{
			Name: "市场主体登记信息", Code: "MARKET_ENTITY",
			Description: "企业、个体工商户等市场主体的注册登记信息",
			DataStandard: "GS/T 1-2017 市场监督管理信息数据标准",
			DataFormat: "JSON", UpdateFrequency: "实时", SourceSystem: "企业信用信息公示系统",
			DataOwnerID: 8, SecurityLevel: "public", Status: 1,
			Fields: string(fields7),
		},
		{
			Name: "纳税申报信息", Code: "TAX_DECLARATION",
			Description: "企业和个人纳税申报、税款缴纳等税务信息",
			DataStandard: "SW/T 1-2018 税收业务数据标准",
			DataFormat: "JSON", UpdateFrequency: "每日", SourceSystem: "金税工程系统",
			DataOwnerID: 9, SecurityLevel: "confidential", Status: 1,
			Fields: string(fields8),
		},
	}

	for _, catalog := range catalogs {
		if err := DB.Create(&catalog).Error; err != nil {
			return err
		}
	}

	log.Println("Data catalogs initialized successfully")
	return nil
}

func initPermissions() error {
	var count int64
	DB.Model(&model.Permission{}).Count(&count)
	if count > 0 {
		log.Println("Permissions already exist, skipping...")
		return nil
	}

	now := time.Now()
	oneYearLater := now.AddDate(1, 0, 0)

	permissions := []model.Permission{
		{UserID: 2, DataCatalogID: 1, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 2, DataCatalogID: 2, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 3, DataCatalogID: 2, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 3, DataCatalogID: 3, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 4, DataCatalogID: 3, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 4, DataCatalogID: 4, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
		{UserID: 5, DataCatalogID: 4, AccessType: "read", Status: 1, ValidFrom: now, ValidTo: oneYearLater},
	}

	for _, perm := range permissions {
		if err := DB.Create(&perm).Error; err != nil {
			return err
		}
	}

	log.Println("Permissions initialized successfully")
	return nil
}
