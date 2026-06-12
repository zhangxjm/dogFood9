package service

import (
	"context"
	"fire-fighting-twin/internal/model"
	"fire-fighting-twin/internal/repository"
	"fmt"
	"math"
	"math/rand"
	"sync"
	"time"
)

type Service struct {
	sqlite    *repository.SQLiteRepo
	redis     *repository.RedisRepo
	startTime time.Time
	mu        sync.RWMutex
}

func NewService(sqlite *repository.SQLiteRepo, redis *repository.RedisRepo) *Service {
	return &Service{
		sqlite:    sqlite,
		redis:     redis,
		startTime: time.Now(),
	}
}

func (s *Service) GetBuilding(ctx context.Context, id int64) (*model.Building, error) {
	cached, err := s.redis.GetCachedBuilding(id)
	if err == nil && cached != nil {
		return cached, nil
	}
	b, err := s.sqlite.GetBuilding(id)
	if err != nil {
		return nil, err
	}
	_ = s.redis.CacheBuilding(b)
	return b, nil
}

func (s *Service) ListBuildings(ctx context.Context) ([]model.Building, error) {
	return s.sqlite.ListBuildings()
}

func (s *Service) CreateBuilding(ctx context.Context, b *model.Building) (*model.Building, error) {
	err := s.sqlite.CreateBuilding(b)
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetBuilding(b.ID)
}

func (s *Service) UpdateBuilding(ctx context.Context, id int64, b *model.Building) (*model.Building, error) {
	err := s.sqlite.UpdateBuilding(id, b)
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetBuilding(id)
}

func (s *Service) ListWaterSources(ctx context.Context, buildingID int64) ([]model.WaterSource, error) {
	return s.sqlite.ListWaterSources(buildingID)
}

func (s *Service) UpdateWaterSourceStatus(ctx context.Context, id int64, status string) (*model.WaterSource, error) {
	err := s.sqlite.UpdateWaterSourceStatus(id, status)
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetWaterSource(id)
}

func (s *Service) ListFirePassages(ctx context.Context, buildingID int64) ([]model.FirePassage, error) {
	return s.sqlite.ListFirePassages(buildingID)
}

func (s *Service) UpdatePassageStatus(ctx context.Context, id int64, status string) (*model.FirePassage, error) {
	err := s.sqlite.UpdatePassageStatus(id, status)
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetFirePassage(id)
}

func (s *Service) ListPersonnel(ctx context.Context, buildingID int64) ([]model.Personnel, error) {
	return s.sqlite.ListPersonnel(buildingID)
}

func (s *Service) UpdatePersonnelLocation(ctx context.Context, id int64, x, y, z float64) (*model.Personnel, error) {
	err := s.sqlite.UpdatePersonnelLocation(id, x, y, z)
	if err != nil {
		return nil, err
	}
	p, err := s.sqlite.GetPersonnel(id)
	if err != nil {
		return nil, err
	}
	_ = s.redis.CachePersonnelLocation(p)
	return p, nil
}

func (s *Service) ListRescuePlans(ctx context.Context, buildingID int64) ([]model.RescuePlan, error) {
	return s.sqlite.ListRescuePlans(buildingID)
}

func (s *Service) CreateRescuePlan(ctx context.Context, p *model.RescuePlan) (*model.RescuePlan, error) {
	err := s.sqlite.CreateRescuePlan(p)
	if err != nil {
		return nil, err
	}
	plans, _ := s.sqlite.ListRescuePlans(p.BuildingID)
	for _, plan := range plans {
		if plan.Name == p.Name {
			return &plan, nil
		}
	}
	return p, nil
}

func (s *Service) SimulateRescuePlan(ctx context.Context, planID int64) ([]model.SimulationStep, float64, float64, error) {
	descriptions := []string{
		"确认火源位置，启动应急响应",
		"疏散附近人员，建立安全警戒线",
		"部署消防水源，开始灭火作业",
		"搜救被困人员，确认安全通道",
		"扩大搜救范围，转移受伤人员",
		"控制火势蔓延，加固防火隔离",
		"全面灭火作业，清理残余火点",
		"火势完全控制，现场安全确认",
	}
	fireSpreadAreas := []float64{50, 120, 200, 280, 350, 300, 180, 30}
	rescueProgresses := []float64{5, 12, 25, 40, 55, 72, 88, 100}

	steps := make([]model.SimulationStep, 8)
	for i := 0; i < 8; i++ {
		steps[i] = model.SimulationStep{
			Step:             int64(i + 1),
			TimeSeconds:      float64((i + 1) * 150),
			Description:      descriptions[i],
			AffectedPersonnel: []model.Personnel{},
			FireSpreadArea:   fireSpreadAreas[i],
			RescueProgress:   rescueProgresses[i],
		}
	}

	return steps, 1200.0, 87.5, nil
}

func (s *Service) ListRescueUnits(ctx context.Context, status string) ([]model.RescueUnit, error) {
	return s.sqlite.ListRescueUnits(status)
}

func (s *Service) ScheduleForce(ctx context.Context, buildingID int64, unitIDs []int64, strategy string) ([]model.RescueUnit, string, error) {
	units := make([]model.RescueUnit, 0, len(unitIDs))
	for _, id := range unitIDs {
		err := s.sqlite.UpdateUnitStatus(id, "出勤中")
		if err != nil {
			continue
		}
		u, err := s.sqlite.GetRescueUnit(id)
		if err != nil {
			continue
		}
		units = append(units, *u)
	}
	summary := fmt.Sprintf("已调度%d个救援单位前往现场，采用%s策略，预计到达时间15分钟", len(units), strategy)
	return units, summary, nil
}

func (s *Service) GetFireSituation(ctx context.Context, buildingID int64) (*model.FireSituation, error) {
	cached, err := s.redis.GetCachedFireSituation(buildingID)
	if err == nil && cached != nil {
		return cached, nil
	}

	fires, err := s.sqlite.ListActiveFires(buildingID)
	if err != nil {
		return nil, err
	}

	var totalArea float64
	for _, f := range fires {
		totalArea += f.SpreadRate * 50
	}

	var threatLevel string
	if totalArea > 500 {
		threatLevel = "极高"
	} else if totalArea > 200 {
		threatLevel = "高"
	} else if totalArea > 100 {
		threatLevel = "中"
	} else {
		threatLevel = "低"
	}

	var actions []string
	switch threatLevel {
	case "极高":
		actions = []string{"立即疏散楼内人员", "请求增援消防力量", "启动全楼喷淋系统"}
	case "高":
		actions = []string{"立即疏散楼内人员", "请求增援消防力量", "启动全楼喷淋系统"}
	case "中":
		actions = []string{"引导人员有序撤离", "部署消防水带灭火", "保持消防通道畅通"}
	default:
		actions = []string{"持续监测火情变化", "准备灭火器材", "通知消防部门待命"}
	}

	situation := &model.FireSituation{
		ActiveFires:        fires,
		TotalArea:          totalArea,
		ThreatLevel:        threatLevel,
		RecommendedActions: actions,
	}

	_ = s.redis.CacheFireSituation(buildingID, situation)

	return situation, nil
}

func (s *Service) ReportFireEvent(ctx context.Context, e *model.FireEvent) (*model.FireEvent, error) {
	err := s.sqlite.CreateFireEvent(e)
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetFireEvent(e.ID)
}

func (s *Service) SendCommand(ctx context.Context, cmd *model.Command) (*model.Command, error) {
	err := s.sqlite.CreateCommand(cmd)
	if err != nil {
		return nil, err
	}
	c, err := s.sqlite.GetCommand(cmd.ID)
	if err != nil {
		return nil, err
	}
	_ = s.redis.PublishCommand(c)
	return c, nil
}

func (s *Service) ListCommands(ctx context.Context, buildingID int64) ([]model.Command, error) {
	return s.sqlite.ListCommands(buildingID)
}

func (s *Service) ListResources(ctx context.Context, typeFilter string) ([]model.Resource, error) {
	return s.sqlite.ListResources(typeFilter)
}

func (s *Service) DispatchResource(ctx context.Context, id int64, lng, lat float64) (*model.Resource, error) {
	err := s.sqlite.UpdateResourceStatus(id, "已调度")
	if err != nil {
		return nil, err
	}
	return s.sqlite.GetResource(id)
}

func (s *Service) GetSystemStatus(ctx context.Context) (*model.SystemStatus, error) {
	cached, err := s.redis.GetCachedSystemStatus()
	if err == nil && cached != nil {
		return cached, nil
	}

	totalBuildings, _ := s.sqlite.CountBuildings()
	activeFires, _ := s.sqlite.CountActiveFires()
	trappedPersonnel, _ := s.sqlite.CountTrappedPersonnel()
	activeCommands, _ := s.sqlite.CountActiveCommands()
	availableUnits, _ := s.sqlite.CountAvailableUnits()

	uptime := time.Since(s.startTime).Truncate(time.Second).String()

	status := &model.SystemStatus{
		TotalBuildings:   totalBuildings,
		ActiveFires:      activeFires,
		TrappedPersonnel: trappedPersonnel,
		ActiveCommands:   activeCommands,
		AvailableUnits:   availableUnits,
		AvgResponseTime:  3.5,
		Uptime:           uptime,
	}

	_ = s.redis.CacheSystemStatus(status)

	return status, nil
}

func (s *Service) GetTraces(ctx context.Context, service string, limit int) ([]model.TraceInfo, error) {
	operations := []string{
		"GetBuilding",
		"ListPersonnel",
		"SendCommand",
		"GetFireSituation",
		"ListWaterSources",
		"UpdatePersonnelLocation",
		"CreateFireEvent",
		"ListRescueUnits",
		"ScheduleForce",
		"GetSystemStatus",
	}
	statuses := []string{"OK", "ERROR"}

	traces := make([]model.TraceInfo, 10)
	for i := 0; i < 10; i++ {
		duration := 5 + rand.Float64()*195
		st := statuses[0]
		if rand.Float64() < 0.15 {
			st = statuses[1]
		}
		traces[i] = model.TraceInfo{
			TraceID:    fmt.Sprintf("%016x", rand.Int63()),
			Service:    service,
			Operation:  operations[i%len(operations)],
			DurationMs: math.Round(duration*100) / 100,
			Status:     st,
		}
	}

	return traces, nil
}

func (s *Service) StartPersonnelSimulation() {
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			s.mu.Lock()
			personnel, err := s.sqlite.ListPersonnelByStatuses([]string{"被困", "已定位", "转移中"})
			if err != nil {
				s.mu.Unlock()
				continue
			}
			for _, p := range personnel {
				dx := (rand.Float64() - 0.5)
				dy := (rand.Float64() - 0.5)
				dz := (rand.Float64() - 0.5)
				newX := p.LocationX + dx
				newY := p.LocationY + dy
				newZ := p.LocationZ + dz
				err := s.sqlite.UpdatePersonnelLocation(p.ID, newX, newY, newZ)
				if err != nil {
					continue
				}
				updated, err := s.sqlite.GetPersonnel(p.ID)
				if err != nil {
					continue
				}
				_ = s.redis.CachePersonnelLocation(updated)
			}
			s.mu.Unlock()
		}
	}()
}
