package model

import "time"

type Building struct {
	ID         int64     `json:"id"`
	Name       string    `json:"name"`
	Address    string    `json:"address"`
	Floors     int32     `json:"floors"`
	ModelURL   string    `json:"model_url"`
	CenterLng  float64   `json:"center_lng"`
	CenterLat  float64   `json:"center_lat"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type WaterSource struct {
	ID         int64     `json:"id"`
	BuildingID int64     `json:"building_id"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Capacity   float64   `json:"capacity"`
	Pressure   float64   `json:"pressure"`
	Status     string    `json:"status"`
	LocationX  float64   `json:"location_x"`
	LocationY  float64   `json:"location_y"`
	LocationZ  float64   `json:"location_z"`
	Floor      string    `json:"floor"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type FirePassage struct {
	ID         int64     `json:"id"`
	BuildingID int64     `json:"building_id"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Width      float64   `json:"width"`
	Status     string    `json:"status"`
	StartX     float64   `json:"start_x"`
	StartY     float64   `json:"start_y"`
	StartZ     float64   `json:"start_z"`
	EndX       float64   `json:"end_x"`
	EndY       float64   `json:"end_y"`
	EndZ       float64   `json:"end_z"`
	Floor      string    `json:"floor"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Personnel struct {
	ID         int64     `json:"id"`
	BuildingID int64     `json:"building_id"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	LocationX  float64   `json:"location_x"`
	LocationY  float64   `json:"location_y"`
	LocationZ  float64   `json:"location_z"`
	Floor      string    `json:"floor"`
	Status     string    `json:"status"`
	DetectedAt time.Time `json:"detected_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type RescuePlan struct {
	ID                int64     `json:"id"`
	BuildingID        int64     `json:"building_id"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	Strategy          string    `json:"strategy"`
	Status            string    `json:"status"`
	EstimatedTime     int32     `json:"estimated_time"`
	PersonnelRequired int32     `json:"personnel_required"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type RescueUnit struct {
	ID             int64     `json:"id"`
	Name           string    `json:"name"`
	Type           string    `json:"type"`
	PersonnelCount int32     `json:"personnel_count"`
	Equipment      string    `json:"equipment"`
	Status         string    `json:"status"`
	LocationLng    float64   `json:"location_lng"`
	LocationLat    float64   `json:"location_lat"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type FireEvent struct {
	ID          int64     `json:"id"`
	BuildingID  int64     `json:"building_id"`
	LocationX   float64   `json:"location_x"`
	LocationY   float64   `json:"location_y"`
	LocationZ   float64   `json:"location_z"`
	Floor       string    `json:"floor"`
	Severity    string    `json:"severity"`
	Temperature float64   `json:"temperature"`
	SpreadRate  float64   `json:"spread_rate"`
	Status      string    `json:"status"`
	DetectedAt  time.Time `json:"detected_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Command struct {
	ID         int64     `json:"id"`
	BuildingID int64     `json:"building_id"`
	FromUnit   string    `json:"from_unit"`
	ToUnit     string    `json:"to_unit"`
	Content    string    `json:"content"`
	Priority   string    `json:"priority"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Resource struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Quantity    int32     `json:"quantity"`
	Status      string    `json:"status"`
	LocationLng float64   `json:"location_lng"`
	LocationLat float64   `json:"location_lat"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SystemStatus struct {
	TotalBuildings   int64   `json:"total_buildings"`
	ActiveFires      int64   `json:"active_fires"`
	TrappedPersonnel int64   `json:"trapped_personnel"`
	ActiveCommands   int64   `json:"active_commands"`
	AvailableUnits   int64   `json:"available_units"`
	AvgResponseTime  float64 `json:"avg_response_time"`
	Uptime           string  `json:"uptime"`
}

type SimulationStep struct {
	Step             int64        `json:"step"`
	TimeSeconds      float64      `json:"time_seconds"`
	Description      string       `json:"description"`
	AffectedPersonnel []Personnel `json:"affected_personnel"`
	FireSpreadArea   float64      `json:"fire_spread_area"`
	RescueProgress   float64      `json:"rescue_progress"`
}

type FireSituation struct {
	ActiveFires        []FireEvent `json:"active_fires"`
	TotalArea          float64     `json:"total_area"`
	ThreatLevel        string      `json:"threat_level"`
	RecommendedActions []string    `json:"recommended_actions"`
}

type TraceInfo struct {
	TraceID     string  `json:"trace_id"`
	Service     string  `json:"service"`
	Operation   string  `json:"operation"`
	DurationMs  float64 `json:"duration_ms"`
	Status      string  `json:"status"`
}
