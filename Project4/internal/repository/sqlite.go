package repository

import (
	"database/sql"
	"time"

	"fire-fighting-twin/internal/model"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(dbPath string) (*SQLiteRepo, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}
	repo := &SQLiteRepo{db: db}
	if err := repo.InitSchema(); err != nil {
		return nil, err
	}
	return repo, nil
}

func (r *SQLiteRepo) InitSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS buildings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		address TEXT,
		floors INTEGER,
		model_url TEXT,
		center_lng REAL,
		center_lat REAL,
		created_at DATETIME,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS water_sources (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		name TEXT,
		type TEXT,
		capacity REAL,
		pressure REAL,
		status TEXT,
		location_x REAL,
		location_y REAL,
		location_z REAL,
		floor TEXT,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS fire_passages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		name TEXT,
		type TEXT,
		width REAL,
		status TEXT,
		start_x REAL,
		start_y REAL,
		start_z REAL,
		end_x REAL,
		end_y REAL,
		end_z REAL,
		floor TEXT,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS personnel (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		name TEXT,
		phone TEXT,
		location_x REAL,
		location_y REAL,
		location_z REAL,
		floor TEXT,
		status TEXT,
		detected_at DATETIME,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS rescue_plans (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		name TEXT,
		description TEXT,
		strategy TEXT,
		status TEXT,
		estimated_time INTEGER,
		personnel_required INTEGER,
		created_at DATETIME,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS rescue_units (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		type TEXT,
		personnel_count INTEGER,
		equipment TEXT,
		status TEXT,
		location_lng REAL,
		location_lat REAL,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS fire_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		location_x REAL,
		location_y REAL,
		location_z REAL,
		floor TEXT,
		severity TEXT,
		temperature REAL,
		spread_rate REAL,
		status TEXT,
		detected_at DATETIME,
		updated_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS commands (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		building_id INTEGER,
		from_unit TEXT,
		to_unit TEXT,
		content TEXT,
		priority TEXT,
		status TEXT,
		created_at DATETIME
	);
	CREATE TABLE IF NOT EXISTS resources (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		type TEXT,
		quantity INTEGER,
		status TEXT,
		location_lng REAL,
		location_lat REAL,
		updated_at DATETIME
	);`
	_, err := r.db.Exec(schema)
	return err
}

func (r *SQLiteRepo) GetBuilding(id int64) (*model.Building, error) {
	b := &model.Building{}
	err := r.db.QueryRow(
		"SELECT id, name, address, floors, model_url, center_lng, center_lat, created_at, updated_at FROM buildings WHERE id = ?",
		id,
	).Scan(&b.ID, &b.Name, &b.Address, &b.Floors, &b.ModelURL, &b.CenterLng, &b.CenterLat, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *SQLiteRepo) ListBuildings() ([]model.Building, error) {
	rows, err := r.db.Query("SELECT id, name, address, floors, model_url, center_lng, center_lat, created_at, updated_at FROM buildings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var buildings []model.Building
	for rows.Next() {
		var b model.Building
		if err := rows.Scan(&b.ID, &b.Name, &b.Address, &b.Floors, &b.ModelURL, &b.CenterLng, &b.CenterLat, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		buildings = append(buildings, b)
	}
	return buildings, rows.Err()
}

func (r *SQLiteRepo) CreateBuilding(b *model.Building) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(
		"INSERT INTO buildings (name, address, floors, model_url, center_lng, center_lat, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		b.Name, b.Address, b.Floors, b.ModelURL, b.CenterLng, b.CenterLat, now, now,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	b.ID = id
	b.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	b.UpdatedAt = b.CreatedAt
	return nil
}

func (r *SQLiteRepo) UpdateBuilding(id int64, b *model.Building) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec(
		"UPDATE buildings SET name=?, address=?, floors=?, model_url=?, center_lng=?, center_lat=?, updated_at=? WHERE id=?",
		b.Name, b.Address, b.Floors, b.ModelURL, b.CenterLng, b.CenterLat, now, id,
	)
	return err
}

func (r *SQLiteRepo) ListWaterSources(buildingID int64) ([]model.WaterSource, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, name, type, capacity, pressure, status, location_x, location_y, location_z, floor, updated_at FROM water_sources WHERE building_id = ?",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sources []model.WaterSource
	for rows.Next() {
		var s model.WaterSource
		if err := rows.Scan(&s.ID, &s.BuildingID, &s.Name, &s.Type, &s.Capacity, &s.Pressure, &s.Status, &s.LocationX, &s.LocationY, &s.LocationZ, &s.Floor, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sources = append(sources, s)
	}
	return sources, rows.Err()
}

func (r *SQLiteRepo) UpdateWaterSourceStatus(id int64, status string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE water_sources SET status=?, updated_at=? WHERE id=?", status, now, id)
	return err
}

func (r *SQLiteRepo) ListFirePassages(buildingID int64) ([]model.FirePassage, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, name, type, width, status, start_x, start_y, start_z, end_x, end_y, end_z, floor, updated_at FROM fire_passages WHERE building_id = ?",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var passages []model.FirePassage
	for rows.Next() {
		var p model.FirePassage
		if err := rows.Scan(&p.ID, &p.BuildingID, &p.Name, &p.Type, &p.Width, &p.Status, &p.StartX, &p.StartY, &p.StartZ, &p.EndX, &p.EndY, &p.EndZ, &p.Floor, &p.UpdatedAt); err != nil {
			return nil, err
		}
		passages = append(passages, p)
	}
	return passages, rows.Err()
}

func (r *SQLiteRepo) UpdatePassageStatus(id int64, status string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE fire_passages SET status=?, updated_at=? WHERE id=?", status, now, id)
	return err
}

func (r *SQLiteRepo) ListPersonnel(buildingID int64) ([]model.Personnel, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, name, phone, location_x, location_y, location_z, floor, status, detected_at, updated_at FROM personnel WHERE building_id = ?",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.Personnel
	for rows.Next() {
		var p model.Personnel
		if err := rows.Scan(&p.ID, &p.BuildingID, &p.Name, &p.Phone, &p.LocationX, &p.LocationY, &p.LocationZ, &p.Floor, &p.Status, &p.DetectedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *SQLiteRepo) UpdatePersonnelLocation(id int64, x, y, z float64) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE personnel SET location_x=?, location_y=?, location_z=?, updated_at=? WHERE id=?", x, y, z, now, id)
	return err
}

func (r *SQLiteRepo) CreatePersonnel(p *model.Personnel) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(
		"INSERT INTO personnel (building_id, name, phone, location_x, location_y, location_z, floor, status, detected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		p.BuildingID, p.Name, p.Phone, p.LocationX, p.LocationY, p.LocationZ, p.Floor, p.Status, now, now,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	p.ID = id
	p.DetectedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	p.UpdatedAt = p.DetectedAt
	return nil
}

func (r *SQLiteRepo) ListRescuePlans(buildingID int64) ([]model.RescuePlan, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, name, description, strategy, status, estimated_time, personnel_required, created_at, updated_at FROM rescue_plans WHERE building_id = ?",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var plans []model.RescuePlan
	for rows.Next() {
		var p model.RescuePlan
		if err := rows.Scan(&p.ID, &p.BuildingID, &p.Name, &p.Description, &p.Strategy, &p.Status, &p.EstimatedTime, &p.PersonnelRequired, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, p)
	}
	return plans, rows.Err()
}

func (r *SQLiteRepo) CreateRescuePlan(p *model.RescuePlan) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(
		"INSERT INTO rescue_plans (building_id, name, description, strategy, status, estimated_time, personnel_required, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		p.BuildingID, p.Name, p.Description, p.Strategy, p.Status, p.EstimatedTime, p.PersonnelRequired, now, now,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	p.ID = id
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	p.UpdatedAt = p.CreatedAt
	return nil
}

func (r *SQLiteRepo) ListRescueUnits(status string) ([]model.RescueUnit, error) {
	var rows *sql.Rows
	var err error
	if status != "" {
		rows, err = r.db.Query(
			"SELECT id, name, type, personnel_count, equipment, status, location_lng, location_lat, updated_at FROM rescue_units WHERE status = ?",
			status,
		)
	} else {
		rows, err = r.db.Query(
			"SELECT id, name, type, personnel_count, equipment, status, location_lng, location_lat, updated_at FROM rescue_units",
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var units []model.RescueUnit
	for rows.Next() {
		var u model.RescueUnit
		if err := rows.Scan(&u.ID, &u.Name, &u.Type, &u.PersonnelCount, &u.Equipment, &u.Status, &u.LocationLng, &u.LocationLat, &u.UpdatedAt); err != nil {
			return nil, err
		}
		units = append(units, u)
	}
	return units, rows.Err()
}

func (r *SQLiteRepo) UpdateUnitStatus(id int64, status string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE rescue_units SET status=?, updated_at=? WHERE id=?", status, now, id)
	return err
}

func (r *SQLiteRepo) ListActiveFires(buildingID int64) ([]model.FireEvent, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, location_x, location_y, location_z, floor, severity, temperature, spread_rate, status, detected_at, updated_at FROM fire_events WHERE building_id = ? AND status != '已扑灭'",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []model.FireEvent
	for rows.Next() {
		var e model.FireEvent
		if err := rows.Scan(&e.ID, &e.BuildingID, &e.LocationX, &e.LocationY, &e.LocationZ, &e.Floor, &e.Severity, &e.Temperature, &e.SpreadRate, &e.Status, &e.DetectedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

func (r *SQLiteRepo) CreateFireEvent(e *model.FireEvent) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(
		"INSERT INTO fire_events (building_id, location_x, location_y, location_z, floor, severity, temperature, spread_rate, status, detected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		e.BuildingID, e.LocationX, e.LocationY, e.LocationZ, e.Floor, e.Severity, e.Temperature, e.SpreadRate, e.Status, now, now,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	e.ID = id
	e.DetectedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	e.UpdatedAt = e.DetectedAt
	return nil
}

func (r *SQLiteRepo) UpdateFireEventStatus(id int64, status string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE fire_events SET status=?, updated_at=? WHERE id=?", status, now, id)
	return err
}

func (r *SQLiteRepo) ListCommands(buildingID int64) ([]model.Command, error) {
	rows, err := r.db.Query(
		"SELECT id, building_id, from_unit, to_unit, content, priority, status, created_at FROM commands WHERE building_id = ?",
		buildingID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cmds []model.Command
	for rows.Next() {
		var c model.Command
		if err := rows.Scan(&c.ID, &c.BuildingID, &c.FromUnit, &c.ToUnit, &c.Content, &c.Priority, &c.Status, &c.CreatedAt); err != nil {
			return nil, err
		}
		cmds = append(cmds, c)
	}
	return cmds, rows.Err()
}

func (r *SQLiteRepo) CreateCommand(c *model.Command) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	res, err := r.db.Exec(
		"INSERT INTO commands (building_id, from_unit, to_unit, content, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		c.BuildingID, c.FromUnit, c.ToUnit, c.Content, c.Priority, c.Status, now,
	)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	c.ID = id
	c.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	return nil
}

func (r *SQLiteRepo) UpdateCommandStatus(id int64, status string) error {
	_, err := r.db.Exec("UPDATE commands SET status=? WHERE id=?", status, id)
	return err
}

func (r *SQLiteRepo) ListResources(typeFilter string) ([]model.Resource, error) {
	var rows *sql.Rows
	var err error
	if typeFilter != "" {
		rows, err = r.db.Query(
			"SELECT id, name, type, quantity, status, location_lng, location_lat, updated_at FROM resources WHERE type = ?",
			typeFilter,
		)
	} else {
		rows, err = r.db.Query(
			"SELECT id, name, type, quantity, status, location_lng, location_lat, updated_at FROM resources",
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var resources []model.Resource
	for rows.Next() {
		var res model.Resource
		if err := rows.Scan(&res.ID, &res.Name, &res.Type, &res.Quantity, &res.Status, &res.LocationLng, &res.LocationLat, &res.UpdatedAt); err != nil {
			return nil, err
		}
		resources = append(resources, res)
	}
	return resources, rows.Err()
}

func (r *SQLiteRepo) UpdateResourceStatus(id int64, status string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := r.db.Exec("UPDATE resources SET status=?, updated_at=? WHERE id=?", status, now, id)
	return err
}

func (r *SQLiteRepo) GetWaterSource(id int64) (*model.WaterSource, error) {
	s := &model.WaterSource{}
	err := r.db.QueryRow("SELECT id, building_id, name, type, capacity, pressure, status, location_x, location_y, location_z, floor, updated_at FROM water_sources WHERE id = ?", id).
		Scan(&s.ID, &s.BuildingID, &s.Name, &s.Type, &s.Capacity, &s.Pressure, &s.Status, &s.LocationX, &s.LocationY, &s.LocationZ, &s.Floor, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *SQLiteRepo) GetFirePassage(id int64) (*model.FirePassage, error) {
	p := &model.FirePassage{}
	err := r.db.QueryRow("SELECT id, building_id, name, type, width, status, start_x, start_y, start_z, end_x, end_y, end_z, floor, updated_at FROM fire_passages WHERE id = ?", id).
		Scan(&p.ID, &p.BuildingID, &p.Name, &p.Type, &p.Width, &p.Status, &p.StartX, &p.StartY, &p.StartZ, &p.EndX, &p.EndY, &p.EndZ, &p.Floor, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *SQLiteRepo) GetPersonnel(id int64) (*model.Personnel, error) {
	p := &model.Personnel{}
	err := r.db.QueryRow("SELECT id, building_id, name, phone, location_x, location_y, location_z, floor, status, detected_at, updated_at FROM personnel WHERE id = ?", id).
		Scan(&p.ID, &p.BuildingID, &p.Name, &p.Phone, &p.LocationX, &p.LocationY, &p.LocationZ, &p.Floor, &p.Status, &p.DetectedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *SQLiteRepo) GetRescueUnit(id int64) (*model.RescueUnit, error) {
	u := &model.RescueUnit{}
	err := r.db.QueryRow("SELECT id, name, type, personnel_count, equipment, status, location_lng, location_lat, updated_at FROM rescue_units WHERE id = ?", id).
		Scan(&u.ID, &u.Name, &u.Type, &u.PersonnelCount, &u.Equipment, &u.Status, &u.LocationLng, &u.LocationLat, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *SQLiteRepo) GetFireEvent(id int64) (*model.FireEvent, error) {
	e := &model.FireEvent{}
	err := r.db.QueryRow("SELECT id, building_id, location_x, location_y, location_z, floor, severity, temperature, spread_rate, status, detected_at, updated_at FROM fire_events WHERE id = ?", id).
		Scan(&e.ID, &e.BuildingID, &e.LocationX, &e.LocationY, &e.LocationZ, &e.Floor, &e.Severity, &e.Temperature, &e.SpreadRate, &e.Status, &e.DetectedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *SQLiteRepo) GetResource(id int64) (*model.Resource, error) {
	res := &model.Resource{}
	err := r.db.QueryRow("SELECT id, name, type, quantity, status, location_lng, location_lat, updated_at FROM resources WHERE id = ?", id).
		Scan(&res.ID, &res.Name, &res.Type, &res.Quantity, &res.Status, &res.LocationLng, &res.LocationLat, &res.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (r *SQLiteRepo) GetCommand(id int64) (*model.Command, error) {
	c := &model.Command{}
	err := r.db.QueryRow("SELECT id, building_id, from_unit, to_unit, content, priority, status, created_at FROM commands WHERE id = ?", id).
		Scan(&c.ID, &c.BuildingID, &c.FromUnit, &c.ToUnit, &c.Content, &c.Priority, &c.Status, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *SQLiteRepo) CountBuildings() (int64, error) {
	var count int64
	err := r.db.QueryRow("SELECT COUNT(*) FROM buildings").Scan(&count)
	return count, err
}

func (r *SQLiteRepo) CountActiveFires() (int64, error) {
	var count int64
	err := r.db.QueryRow("SELECT COUNT(*) FROM fire_events WHERE status != '已扑灭'").Scan(&count)
	return count, err
}

func (r *SQLiteRepo) CountTrappedPersonnel() (int64, error) {
	var count int64
	err := r.db.QueryRow("SELECT COUNT(*) FROM personnel WHERE status IN ('被困', '已定位')").Scan(&count)
	return count, err
}

func (r *SQLiteRepo) CountActiveCommands() (int64, error) {
	var count int64
	err := r.db.QueryRow("SELECT COUNT(*) FROM commands WHERE status IN ('已发送', '执行中')").Scan(&count)
	return count, err
}

func (r *SQLiteRepo) CountAvailableUnits() (int64, error) {
	var count int64
	err := r.db.QueryRow("SELECT COUNT(*) FROM rescue_units WHERE status = '待命'").Scan(&count)
	return count, err
}

func (r *SQLiteRepo) ListPersonnelByStatuses(statuses []string) ([]model.Personnel, error) {
	query := "SELECT id, building_id, name, phone, location_x, location_y, location_z, floor, status, detected_at, updated_at FROM personnel WHERE status IN ("
	args := make([]interface{}, len(statuses))
	for i, s := range statuses {
		if i > 0 {
			query += ","
		}
		query += "?"
		args[i] = s
	}
	query += ")"
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.Personnel
	for rows.Next() {
		var p model.Personnel
		if err := rows.Scan(&p.ID, &p.BuildingID, &p.Name, &p.Phone, &p.LocationX, &p.LocationY, &p.LocationZ, &p.Floor, &p.Status, &p.DetectedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *SQLiteRepo) SeedData() error {
	now := time.Now().Format("2006-01-02 15:04:05")

	buildings := []struct {
		name      string
		address   string
		floors    int32
		modelURL  string
		centerLng float64
		centerLat float64
	}{
		{"万达商业广场", "上海市杨浦区淞沪路77号", 6, "/models/wanda.glb", 121.47, 31.23},
		{"翠苑小区住宅楼", "杭州市西湖区翠苑街道", 18, "/models/cuiyuan.glb", 121.40, 31.25},
		{"科技产业园A栋", "上海市浦东新区张江高科技园区", 12, "/models/techpark.glb", 121.52, 31.28},
	}
	buildingIDs := make([]int64, len(buildings))
	for i, b := range buildings {
		res, err := r.db.Exec(
			"INSERT INTO buildings (name, address, floors, model_url, center_lng, center_lat, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			b.name, b.address, b.floors, b.modelURL, b.centerLng, b.centerLat, now, now,
		)
		if err != nil {
			return err
		}
		buildingIDs[i], _ = res.LastInsertId()
	}

	waterSources := []struct {
		buildingIdx int
		name        string
		typ         string
		capacity    float64
		pressure    float64
		status      string
		x, y, z     float64
		floor       string
	}{
		{0, "1楼消火栓A", "消火栓", 0.0, 0.8, "正常", 10.5, 5.2, 0.0, "1F"},
		{0, "地下消防水池", "消防水池", 200.0, 0.6, "正常", 0.0, 0.0, -1.0, "B1"},
		{1, "3楼消火栓B", "消火栓", 0.0, 0.7, "维护中", 15.0, 8.0, 9.0, "3F"},
		{1, "5楼喷淋系统", "喷淋系统", 50.0, 0.5, "正常", 20.0, 12.0, 15.0, "5F"},
		{2, "大厅消火栓C", "消火栓", 0.0, 0.9, "正常", 5.0, 3.0, 0.0, "1F"},
		{2, "2楼喷淋系统", "喷淋系统", 80.0, 0.6, "正常", 12.0, 7.5, 3.0, "2F"},
	}
	for _, ws := range waterSources {
		_, err := r.db.Exec(
			"INSERT INTO water_sources (building_id, name, type, capacity, pressure, status, location_x, location_y, location_z, floor, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[ws.buildingIdx], ws.name, ws.typ, ws.capacity, ws.pressure, ws.status, ws.x, ws.y, ws.z, ws.floor, now,
		)
		if err != nil {
			return err
		}
	}

	passages := []struct {
		buildingIdx int
		name        string
		typ         string
		width       float64
		status      string
		sx, sy, sz  float64
		ex, ey, ez  float64
		floor       string
	}{
		{0, "东侧疏散楼梯", "疏散楼梯", 1.2, "畅通", 30.0, 0.0, 0.0, 30.0, 0.0, 18.0, "1F-6F"},
		{0, "主消防通道", "消防通道", 3.0, "畅通", 0.0, 0.0, 0.0, 50.0, 0.0, 0.0, "1F"},
		{0, "西侧安全出口", "安全出口", 1.5, "堵塞", 0.0, 25.0, 0.0, 0.0, 25.0, 0.0, "1F"},
		{1, "北面疏散楼梯", "疏散楼梯", 1.4, "畅通", 0.0, 0.0, 0.0, 0.0, 0.0, 54.0, "1F-18F"},
		{1, "南侧消防通道", "消防通道", 2.8, "畅通", 10.0, 0.0, 0.0, 10.0, 40.0, 0.0, "1F"},
		{1, "东侧安全出口", "安全出口", 1.6, "畅通", 40.0, 0.0, 0.0, 40.0, 0.0, 0.0, "1F"},
		{2, "主疏散楼梯", "疏散楼梯", 1.3, "畅通", 25.0, 0.0, 0.0, 25.0, 0.0, 36.0, "1F-12F"},
		{2, "西侧消防通道", "消防通道", 2.5, "堵塞", 0.0, 15.0, 0.0, 0.0, 15.0, 0.0, "1F"},
	}
	for _, fp := range passages {
		_, err := r.db.Exec(
			"INSERT INTO fire_passages (building_id, name, type, width, status, start_x, start_y, start_z, end_x, end_y, end_z, floor, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[fp.buildingIdx], fp.name, fp.typ, fp.width, fp.status, fp.sx, fp.sy, fp.sz, fp.ex, fp.ey, fp.ez, fp.floor, now,
		)
		if err != nil {
			return err
		}
	}

	personnel := []struct {
		buildingIdx int
		name        string
		phone       string
		x, y, z     float64
		floor       string
		status      string
	}{
		{0, "张三", "13800138001", 12.5, 8.0, 6.0, "3F", "被困"},
		{0, "李四", "13800138002", 25.0, 15.0, 12.0, "5F", "已定位"},
		{1, "王五", "13800138003", 8.0, 20.0, 36.0, "10F", "转移中"},
		{1, "赵六", "13800138004", 30.0, 5.0, 45.0, "12F", "被困"},
		{2, "钱七", "13800138005", 18.0, 10.0, 9.0, "4F", "已定位"},
	}
	for _, p := range personnel {
		_, err := r.db.Exec(
			"INSERT INTO personnel (building_id, name, phone, location_x, location_y, location_z, floor, status, detected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[p.buildingIdx], p.name, p.phone, p.x, p.y, p.z, p.floor, p.status, now, now,
		)
		if err != nil {
			return err
		}
	}

	rescuePlans := []struct {
		buildingIdx       int
		name              string
		description       string
		strategy          string
		status            string
		estimatedTime     int32
		personnelRequired int32
	}{
		{0, "万达广场3楼搜救方案", "针对3楼被困人员实施内部搜救", "内部搜救", "执行中", 30, 8},
		{0, "万达广场5楼云梯救援", "使用云梯从外部救援5楼人员", "外部云梯", "待执行", 45, 12},
		{1, "翠苑小区分区搜索方案", "对10楼和12楼分区搜索救援", "分区搜索", "执行中", 60, 15},
		{2, "科技园全面疏散方案", "组织全楼人员有序疏散", "全面疏散", "待执行", 20, 6},
	}
	for _, rp := range rescuePlans {
		_, err := r.db.Exec(
			"INSERT INTO rescue_plans (building_id, name, description, strategy, status, estimated_time, personnel_required, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[rp.buildingIdx], rp.name, rp.description, rp.strategy, rp.status, rp.estimatedTime, rp.personnelRequired, now, now,
		)
		if err != nil {
			return err
		}
	}

	rescueUnits := []struct {
		name           string
		typ            string
		personnelCount int32
		equipment      string
		status         string
		lng, lat       float64
	}{
		{"浦东消防中队", "消防中队", 25, "水罐车,泵浦车", "出勤中", 121.48, 31.24},
		{"杨浦特勤中队", "特勤中队", 30, "抢险车,化学车", "待命", 121.52, 31.27},
		{"徐汇云梯车队", "云梯车队", 15, "54米云梯车,32米云梯车", "出勤中", 121.43, 31.19},
		{"长宁消防中队", "消防中队", 20, "水罐车,泡沫车", "待命", 121.42, 31.22},
		{"虹桥特勤中队", "特勤中队", 28, "抢险车,照明车", "休整", 121.33, 31.20},
		{"松江云梯车队", "云梯车队", 12, "32米云梯车", "待命", 121.23, 31.01},
	}
	for _, ru := range rescueUnits {
		_, err := r.db.Exec(
			"INSERT INTO rescue_units (name, type, personnel_count, equipment, status, location_lng, location_lat, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			ru.name, ru.typ, ru.personnelCount, ru.equipment, ru.status, ru.lng, ru.lat, now,
		)
		if err != nil {
			return err
		}
	}

	fireEvents := []struct {
		buildingIdx  int
		x, y, z      float64
		floor        string
		severity     string
		temperature  float64
		spreadRate   float64
		status       string
	}{
		{0, 15.0, 10.0, 6.0, "3F", "中", 280.5, 0.8, "蔓延中"},
		{0, 28.0, 18.0, 12.0, "5F", "高", 450.0, 1.2, "蔓延中"},
		{1, 10.0, 22.0, 36.0, "10F", "低", 150.0, 0.3, "控制中"},
	}
	for _, fe := range fireEvents {
		_, err := r.db.Exec(
			"INSERT INTO fire_events (building_id, location_x, location_y, location_z, floor, severity, temperature, spread_rate, status, detected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[fe.buildingIdx], fe.x, fe.y, fe.z, fe.floor, fe.severity, fe.temperature, fe.spreadRate, fe.status, now, now,
		)
		if err != nil {
			return err
		}
	}

	commands := []struct {
		buildingIdx int
		fromUnit    string
		toUnit      string
		content     string
		priority    string
		status      string
	}{
		{0, "指挥中心", "浦东消防中队", "立即前往万达广场3楼灭火", "紧急", "执行中"},
		{0, "指挥中心", "徐汇云梯车队", "部署云梯至万达广场5楼救援", "紧急", "已发送"},
		{0, "浦东消防中队", "杨浦特勤中队", "请求支援万达广场5楼", "重要", "已发送"},
		{1, "指挥中心", "长宁消防中队", "支援翠苑小区10楼灭火", "重要", "已完成"},
		{2, "指挥中心", "杨浦特勤中队", "科技产业园待命警戒", "普通", "已发送"},
	}
	for _, c := range commands {
		_, err := r.db.Exec(
			"INSERT INTO commands (building_id, from_unit, to_unit, content, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			buildingIDs[c.buildingIdx], c.fromUnit, c.toUnit, c.content, c.priority, c.status, now,
		)
		if err != nil {
			return err
		}
	}

	resources := []struct {
		name     string
		typ      string
		quantity int32
		status   string
		lng, lat float64
	}{
		{"消防水带200型", "消防水带", 50, "可用", 121.47, 31.23},
		{"干粉灭火器", "灭火器", 100, "可用", 121.47, 31.23},
		{"防毒面具SF-08", "防毒面具", 30, "已调度", 121.40, 31.25},
		{"54米云梯", "云梯", 2, "使用中", 121.43, 31.19},
		{"泡沫灭火器", "灭火器", 40, "可用", 121.52, 31.28},
		{"消防水带150型", "消防水带", 80, "已调度", 121.48, 31.24},
		{"空气呼吸器", "防毒面具", 25, "可用", 121.42, 31.22},
		{"32米云梯", "云梯", 3, "可用", 121.23, 31.01},
	}
	for _, res := range resources {
		_, err := r.db.Exec(
			"INSERT INTO resources (name, type, quantity, status, location_lng, location_lat, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			res.name, res.typ, res.quantity, res.status, res.lng, res.lat, now,
		)
		if err != nil {
			return err
		}
	}

	return nil
}
