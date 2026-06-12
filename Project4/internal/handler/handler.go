package handler

import (
	"context"

	pb "fire-fighting-twin/api/gen/firefighting"
	"fire-fighting-twin/internal/model"
	"fire-fighting-twin/internal/service"
)

type BuildingHandler struct {
	pb.UnimplementedBuildingServiceServer
	svc *service.Service
}

func NewBuildingHandler(svc *service.Service) *BuildingHandler {
	return &BuildingHandler{svc: svc}
}

func (h *BuildingHandler) GetBuilding(ctx context.Context, req *pb.GetBuildingRequest) (*pb.Building, error) {
	b, err := h.svc.GetBuilding(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return modelToProtoBuilding(b), nil
}

func (h *BuildingHandler) ListBuildings(ctx context.Context, req *pb.ListBuildingsRequest) (*pb.ListBuildingsResponse, error) {
	buildings, err := h.svc.ListBuildings(ctx)
	if err != nil {
		return nil, err
	}
	var pbBuildings []*pb.Building
	for _, b := range buildings {
		pbBuildings = append(pbBuildings, modelToProtoBuilding(&b))
	}
	return &pb.ListBuildingsResponse{Buildings: pbBuildings}, nil
}

func (h *BuildingHandler) CreateBuilding(ctx context.Context, req *pb.CreateBuildingRequest) (*pb.Building, error) {
	b := protoToModelBuilding(req.Building)
	result, err := h.svc.CreateBuilding(ctx, b)
	if err != nil {
		return nil, err
	}
	return modelToProtoBuilding(result), nil
}

func (h *BuildingHandler) UpdateBuilding(ctx context.Context, req *pb.UpdateBuildingRequest) (*pb.Building, error) {
	b := protoToModelBuilding(req.Building)
	result, err := h.svc.UpdateBuilding(ctx, req.Id, b)
	if err != nil {
		return nil, err
	}
	return modelToProtoBuilding(result), nil
}

type WaterSourceHandler struct {
	pb.UnimplementedWaterSourceServiceServer
	svc *service.Service
}

func NewWaterSourceHandler(svc *service.Service) *WaterSourceHandler {
	return &WaterSourceHandler{svc: svc}
}

func (h *WaterSourceHandler) ListWaterSources(ctx context.Context, req *pb.ListWaterSourcesRequest) (*pb.ListWaterSourcesResponse, error) {
	sources, err := h.svc.ListWaterSources(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var pbSources []*pb.WaterSource
	for _, s := range sources {
		pbSources = append(pbSources, modelToProtoWaterSource(&s))
	}
	return &pb.ListWaterSourcesResponse{WaterSources: pbSources}, nil
}

func (h *WaterSourceHandler) UpdateWaterSourceStatus(ctx context.Context, req *pb.UpdateWaterSourceStatusRequest) (*pb.WaterSource, error) {
	ws, err := h.svc.UpdateWaterSourceStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}
	return modelToProtoWaterSource(ws), nil
}

type FirePassageHandler struct {
	pb.UnimplementedFirePassageServiceServer
	svc *service.Service
}

func NewFirePassageHandler(svc *service.Service) *FirePassageHandler {
	return &FirePassageHandler{svc: svc}
}

func (h *FirePassageHandler) ListFirePassages(ctx context.Context, req *pb.ListFirePassagesRequest) (*pb.ListFirePassagesResponse, error) {
	passages, err := h.svc.ListFirePassages(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var pbPassages []*pb.FirePassage
	for _, p := range passages {
		pbPassages = append(pbPassages, modelToProtoFirePassage(&p))
	}
	return &pb.ListFirePassagesResponse{FirePassages: pbPassages}, nil
}

func (h *FirePassageHandler) UpdatePassageStatus(ctx context.Context, req *pb.UpdatePassageStatusRequest) (*pb.FirePassage, error) {
	fp, err := h.svc.UpdatePassageStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}
	return modelToProtoFirePassage(fp), nil
}

type PersonnelHandler struct {
	pb.UnimplementedPersonnelServiceServer
	svc *service.Service
}

func NewPersonnelHandler(svc *service.Service) *PersonnelHandler {
	return &PersonnelHandler{svc: svc}
}

func (h *PersonnelHandler) ListPersonnel(ctx context.Context, req *pb.ListPersonnelRequest) (*pb.ListPersonnelResponse, error) {
	personnel, err := h.svc.ListPersonnel(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var pbPersonnel []*pb.Personnel
	for _, p := range personnel {
		pbPersonnel = append(pbPersonnel, modelToProtoPersonnel(&p))
	}
	return &pb.ListPersonnelResponse{Personnel: pbPersonnel}, nil
}

func (h *PersonnelHandler) UpdatePersonnelLocation(ctx context.Context, req *pb.UpdatePersonnelLocationRequest) (*pb.Personnel, error) {
	p, err := h.svc.UpdatePersonnelLocation(ctx, req.Id, req.LocationX, req.LocationY, req.LocationZ)
	if err != nil {
		return nil, err
	}
	return modelToProtoPersonnel(p), nil
}

type RescuePlanHandler struct {
	pb.UnimplementedRescuePlanServiceServer
	svc *service.Service
}

func NewRescuePlanHandler(svc *service.Service) *RescuePlanHandler {
	return &RescuePlanHandler{svc: svc}
}

func (h *RescuePlanHandler) ListRescuePlans(ctx context.Context, req *pb.ListRescuePlansRequest) (*pb.ListRescuePlansResponse, error) {
	plans, err := h.svc.ListRescuePlans(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var pbPlans []*pb.RescuePlan
	for _, p := range plans {
		pbPlans = append(pbPlans, modelToProtoRescuePlan(&p))
	}
	return &pb.ListRescuePlansResponse{RescuePlans: pbPlans}, nil
}

func (h *RescuePlanHandler) CreateRescuePlan(ctx context.Context, req *pb.CreateRescuePlanRequest) (*pb.RescuePlan, error) {
	p := protoToModelRescuePlan(req.RescuePlan)
	result, err := h.svc.CreateRescuePlan(ctx, p)
	if err != nil {
		return nil, err
	}
	return modelToProtoRescuePlan(result), nil
}

func (h *RescuePlanHandler) SimulateRescuePlan(ctx context.Context, req *pb.SimulateRescuePlanRequest) (*pb.SimulateRescuePlanResponse, error) {
	steps, totalTime, successRate, err := h.svc.SimulateRescuePlan(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	var pbSteps []*pb.SimulationStep
	for _, s := range steps {
		var affected []*pb.Personnel
		for _, p := range s.AffectedPersonnel {
			affected = append(affected, modelToProtoPersonnel(&p))
		}
		pbSteps = append(pbSteps, &pb.SimulationStep{
			Step:             int32(s.Step),
			TimeSeconds:      s.TimeSeconds,
			Description:      s.Description,
			AffectedPersonnel: affected,
			FireSpreadArea:   s.FireSpreadArea,
			RescueProgress:   s.RescueProgress,
		})
	}
	return &pb.SimulateRescuePlanResponse{
		Steps:       pbSteps,
		TotalTime:   totalTime,
		SuccessRate: successRate,
	}, nil
}

type ForceScheduleHandler struct {
	pb.UnimplementedForceScheduleServiceServer
	svc *service.Service
}

func NewForceScheduleHandler(svc *service.Service) *ForceScheduleHandler {
	return &ForceScheduleHandler{svc: svc}
}

func (h *ForceScheduleHandler) ListRescueUnits(ctx context.Context, req *pb.ListRescueUnitsRequest) (*pb.ListRescueUnitsResponse, error) {
	units, err := h.svc.ListRescueUnits(ctx, req.Status)
	if err != nil {
		return nil, err
	}
	var pbUnits []*pb.RescueUnit
	for _, u := range units {
		pbUnits = append(pbUnits, modelToProtoRescueUnit(&u))
	}
	return &pb.ListRescueUnitsResponse{RescueUnits: pbUnits}, nil
}

func (h *ForceScheduleHandler) ScheduleForce(ctx context.Context, req *pb.ScheduleForceRequest) (*pb.ScheduleForceResponse, error) {
	units, summary, err := h.svc.ScheduleForce(ctx, req.BuildingId, req.UnitIds, req.Strategy)
	if err != nil {
		return nil, err
	}
	var pbUnits []*pb.RescueUnit
	for _, u := range units {
		pbUnits = append(pbUnits, modelToProtoRescueUnit(&u))
	}
	return &pb.ScheduleForceResponse{
		DispatchedUnits: pbUnits,
		PlanSummary:    summary,
	}, nil
}

type FireSituationHandler struct {
	pb.UnimplementedFireSituationServiceServer
	svc *service.Service
}

func NewFireSituationHandler(svc *service.Service) *FireSituationHandler {
	return &FireSituationHandler{svc: svc}
}

func (h *FireSituationHandler) GetFireSituation(ctx context.Context, req *pb.GetFireSituationRequest) (*pb.FireSituation, error) {
	situation, err := h.svc.GetFireSituation(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var activeFires []*pb.FireEvent
	for _, f := range situation.ActiveFires {
		activeFires = append(activeFires, modelToProtoFireEvent(&f))
	}
	return &pb.FireSituation{
		ActiveFires:        activeFires,
		TotalArea:          situation.TotalArea,
		ThreatLevel:        situation.ThreatLevel,
		RecommendedActions: situation.RecommendedActions,
	}, nil
}

func (h *FireSituationHandler) ReportFireEvent(ctx context.Context, req *pb.ReportFireEventRequest) (*pb.FireEvent, error) {
	e := protoToModelFireEvent(req.FireEvent)
	result, err := h.svc.ReportFireEvent(ctx, e)
	if err != nil {
		return nil, err
	}
	return modelToProtoFireEvent(result), nil
}

type CommandHandler struct {
	pb.UnimplementedCommandServiceServer
	svc *service.Service
}

func NewCommandHandler(svc *service.Service) *CommandHandler {
	return &CommandHandler{svc: svc}
}

func (h *CommandHandler) SendCommand(ctx context.Context, req *pb.SendCommandRequest) (*pb.Command, error) {
	cmd := &model.Command{
		BuildingID: req.BuildingId,
		FromUnit:   req.FromUnit,
		ToUnit:     req.ToUnit,
		Content:    req.Content,
		Priority:   req.Priority,
	}
	result, err := h.svc.SendCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	return modelToProtoCommand(result), nil
}

func (h *CommandHandler) ListCommands(ctx context.Context, req *pb.ListCommandsRequest) (*pb.ListCommandsResponse, error) {
	commands, err := h.svc.ListCommands(ctx, req.BuildingId)
	if err != nil {
		return nil, err
	}
	var pbCommands []*pb.Command
	for _, c := range commands {
		pbCommands = append(pbCommands, modelToProtoCommand(&c))
	}
	return &pb.ListCommandsResponse{Commands: pbCommands}, nil
}

type ResourceHandler struct {
	pb.UnimplementedResourceServiceServer
	svc *service.Service
}

func NewResourceHandler(svc *service.Service) *ResourceHandler {
	return &ResourceHandler{svc: svc}
}

func (h *ResourceHandler) ListResources(ctx context.Context, req *pb.ListResourcesRequest) (*pb.ListResourcesResponse, error) {
	resources, err := h.svc.ListResources(ctx, req.Type)
	if err != nil {
		return nil, err
	}
	var pbResources []*pb.Resource
	for _, r := range resources {
		pbResources = append(pbResources, modelToProtoResource(&r))
	}
	return &pb.ListResourcesResponse{Resources: pbResources}, nil
}

func (h *ResourceHandler) DispatchResource(ctx context.Context, req *pb.DispatchResourceRequest) (*pb.Resource, error) {
	r, err := h.svc.DispatchResource(ctx, req.Id, req.TargetLng, req.TargetLat)
	if err != nil {
		return nil, err
	}
	return modelToProtoResource(r), nil
}

type MonitorHandler struct {
	pb.UnimplementedMonitorServiceServer
	svc *service.Service
}

func NewMonitorHandler(svc *service.Service) *MonitorHandler {
	return &MonitorHandler{svc: svc}
}

func (h *MonitorHandler) GetSystemStatus(ctx context.Context, req *pb.GetSystemStatusRequest) (*pb.SystemStatus, error) {
	status, err := h.svc.GetSystemStatus(ctx)
	if err != nil {
		return nil, err
	}
	return &pb.SystemStatus{
		TotalBuildings:   status.TotalBuildings,
		ActiveFires:      status.ActiveFires,
		TrappedPersonnel: status.TrappedPersonnel,
		ActiveCommands:   status.ActiveCommands,
		AvailableUnits:   status.AvailableUnits,
		AvgResponseTime:  status.AvgResponseTime,
		Uptime:           status.Uptime,
	}, nil
}

func (h *MonitorHandler) GetTraces(ctx context.Context, req *pb.GetTracesRequest) (*pb.TracesResponse, error) {
	traces, err := h.svc.GetTraces(ctx, req.Service, int(req.Limit))
	if err != nil {
		return nil, err
	}
	var pbTraces []*pb.TraceInfo
	for _, t := range traces {
		pbTraces = append(pbTraces, &pb.TraceInfo{
			TraceId:    t.TraceID,
			Service:    t.Service,
			Operation:  t.Operation,
			DurationMs: t.DurationMs,
			Status:     t.Status,
		})
	}
	return &pb.TracesResponse{Traces: pbTraces}, nil
}

func modelToProtoBuilding(b *model.Building) *pb.Building {
	if b == nil {
		return nil
	}
	return &pb.Building{
		Id:        b.ID,
		Name:      b.Name,
		Address:   b.Address,
		Floors:    b.Floors,
		ModelUrl:  b.ModelURL,
		CenterLng: b.CenterLng,
		CenterLat: b.CenterLat,
		CreatedAt: b.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: b.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func protoToModelBuilding(b *pb.Building) *model.Building {
	if b == nil {
		return nil
	}
	return &model.Building{
		ID:        b.Id,
		Name:      b.Name,
		Address:   b.Address,
		Floors:    b.Floors,
		ModelURL:  b.ModelUrl,
		CenterLng: b.CenterLng,
		CenterLat: b.CenterLat,
	}
}

func modelToProtoWaterSource(ws *model.WaterSource) *pb.WaterSource {
	if ws == nil {
		return nil
	}
	return &pb.WaterSource{
		Id:         ws.ID,
		BuildingId: ws.BuildingID,
		Name:       ws.Name,
		Type:       ws.Type,
		Capacity:   ws.Capacity,
		Pressure:   ws.Pressure,
		Status:     ws.Status,
		LocationX:  ws.LocationX,
		LocationY:  ws.LocationY,
		LocationZ:  ws.LocationZ,
		Floor:      ws.Floor,
		UpdatedAt:  ws.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func modelToProtoFirePassage(fp *model.FirePassage) *pb.FirePassage {
	if fp == nil {
		return nil
	}
	return &pb.FirePassage{
		Id:         fp.ID,
		BuildingId: fp.BuildingID,
		Name:       fp.Name,
		Type:       fp.Type,
		Width:      fp.Width,
		Status:     fp.Status,
		StartX:     fp.StartX,
		StartY:     fp.StartY,
		StartZ:     fp.StartZ,
		EndX:       fp.EndX,
		EndY:       fp.EndY,
		EndZ:       fp.EndZ,
		Floor:      fp.Floor,
		UpdatedAt:  fp.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func modelToProtoPersonnel(p *model.Personnel) *pb.Personnel {
	if p == nil {
		return nil
	}
	return &pb.Personnel{
		Id:         p.ID,
		BuildingId: p.BuildingID,
		Name:       p.Name,
		Phone:      p.Phone,
		LocationX:  p.LocationX,
		LocationY:  p.LocationY,
		LocationZ:  p.LocationZ,
		Floor:      p.Floor,
		Status:     p.Status,
		DetectedAt: p.DetectedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  p.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func modelToProtoRescuePlan(p *model.RescuePlan) *pb.RescuePlan {
	if p == nil {
		return nil
	}
	return &pb.RescuePlan{
		Id:                p.ID,
		BuildingId:        p.BuildingID,
		Name:              p.Name,
		Description:       p.Description,
		Strategy:          p.Strategy,
		Status:            p.Status,
		EstimatedTime:     p.EstimatedTime,
		PersonnelRequired: p.PersonnelRequired,
		CreatedAt:         p.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:         p.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func protoToModelRescuePlan(p *pb.RescuePlan) *model.RescuePlan {
	if p == nil {
		return nil
	}
	return &model.RescuePlan{
		ID:                p.Id,
		BuildingID:        p.BuildingId,
		Name:              p.Name,
		Description:       p.Description,
		Strategy:          p.Strategy,
		Status:            p.Status,
		EstimatedTime:     p.EstimatedTime,
		PersonnelRequired: p.PersonnelRequired,
	}
}

func modelToProtoRescueUnit(u *model.RescueUnit) *pb.RescueUnit {
	if u == nil {
		return nil
	}
	return &pb.RescueUnit{
		Id:             u.ID,
		Name:           u.Name,
		Type:           u.Type,
		PersonnelCount: u.PersonnelCount,
		Equipment:      u.Equipment,
		Status:         u.Status,
		LocationLng:    u.LocationLng,
		LocationLat:    u.LocationLat,
		UpdatedAt:      u.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func modelToProtoFireEvent(e *model.FireEvent) *pb.FireEvent {
	if e == nil {
		return nil
	}
	return &pb.FireEvent{
		Id:          e.ID,
		BuildingId:  e.BuildingID,
		LocationX:   e.LocationX,
		LocationY:   e.LocationY,
		LocationZ:   e.LocationZ,
		Floor:       e.Floor,
		Severity:    e.Severity,
		Temperature: e.Temperature,
		SpreadRate:  e.SpreadRate,
		Status:      e.Status,
		DetectedAt:  e.DetectedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   e.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func protoToModelFireEvent(e *pb.FireEvent) *model.FireEvent {
	if e == nil {
		return nil
	}
	return &model.FireEvent{
		BuildingID:  e.BuildingId,
		LocationX:   e.LocationX,
		LocationY:   e.LocationY,
		LocationZ:   e.LocationZ,
		Floor:       e.Floor,
		Severity:    e.Severity,
		Temperature: e.Temperature,
		SpreadRate:  e.SpreadRate,
		Status:      e.Status,
	}
}

func modelToProtoCommand(c *model.Command) *pb.Command {
	if c == nil {
		return nil
	}
	return &pb.Command{
		Id:         c.ID,
		BuildingId: c.BuildingID,
		FromUnit:   c.FromUnit,
		ToUnit:     c.ToUnit,
		Content:    c.Content,
		Priority:   c.Priority,
		Status:     c.Status,
		CreatedAt:  c.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

func modelToProtoResource(r *model.Resource) *pb.Resource {
	if r == nil {
		return nil
	}
	return &pb.Resource{
		Id:          r.ID,
		Name:        r.Name,
		Type:        r.Type,
		Quantity:    r.Quantity,
		Status:      r.Status,
		LocationLng: r.LocationLng,
		LocationLat: r.LocationLat,
		UpdatedAt:   r.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
