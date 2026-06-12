package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"fire-fighting-twin/internal/model"

	"github.com/redis/go-redis/v9"
)

type RedisRepo struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisRepo(addr, password string, db int) (*RedisRepo, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return &RedisRepo{client: client, ctx: ctx}, nil
}

func NewRedisRepoWithClient(client *redis.Client) (*RedisRepo, error) {
	return &RedisRepo{client: client, ctx: context.Background()}, nil
}

func (r *RedisRepo) CacheBuilding(b *model.Building) error {
	data, err := json.Marshal(b)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, fmt.Sprintf("building:%d", b.ID), data, 10*time.Minute).Err()
}

func (r *RedisRepo) GetCachedBuilding(id int64) (*model.Building, error) {
	data, err := r.client.Get(r.ctx, fmt.Sprintf("building:%d", id)).Bytes()
	if err != nil {
		return nil, err
	}
	var b model.Building
	if err := json.Unmarshal(data, &b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *RedisRepo) CachePersonnelLocation(p *model.Personnel) error {
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}
	return r.client.HSet(r.ctx, "personnel:locations", fmt.Sprintf("personnel:%d", p.ID), data).Err()
}

func (r *RedisRepo) GetPersonnelLocations(buildingID int64) ([]model.Personnel, error) {
	result, err := r.client.HGetAll(r.ctx, "personnel:locations").Result()
	if err != nil {
		return nil, err
	}
	var personnel []model.Personnel
	for _, v := range result {
		var p model.Personnel
		if err := json.Unmarshal([]byte(v), &p); err != nil {
			continue
		}
		if p.BuildingID == buildingID {
			personnel = append(personnel, p)
		}
	}
	return personnel, nil
}

func (r *RedisRepo) CacheFireSituation(buildingID int64, situation *model.FireSituation) error {
	data, err := json.Marshal(situation)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, fmt.Sprintf("fire_situation:%d", buildingID), data, 5*time.Minute).Err()
}

func (r *RedisRepo) GetCachedFireSituation(buildingID int64) (*model.FireSituation, error) {
	data, err := r.client.Get(r.ctx, fmt.Sprintf("fire_situation:%d", buildingID)).Bytes()
	if err != nil {
		return nil, err
	}
	var s model.FireSituation
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *RedisRepo) PublishCommand(cmd *model.Command) error {
	data, err := json.Marshal(cmd)
	if err != nil {
		return err
	}
	return r.client.Publish(r.ctx, fmt.Sprintf("commands:%d", cmd.BuildingID), data).Err()
}

func (r *RedisRepo) SubscribeCommands(buildingID int64) *redis.PubSub {
	return r.client.Subscribe(r.ctx, fmt.Sprintf("commands:%d", buildingID))
}

func (r *RedisRepo) CacheSystemStatus(status *model.SystemStatus) error {
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, "system:status", data, 1*time.Minute).Err()
}

func (r *RedisRepo) GetCachedSystemStatus() (*model.SystemStatus, error) {
	data, err := r.client.Get(r.ctx, "system:status").Bytes()
	if err != nil {
		return nil, err
	}
	var s model.SystemStatus
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *RedisRepo) SetPersonnelPosition(personnelID int64, x, y, z float64) error {
	return r.client.GeoAdd(r.ctx, "personnel:geo", &redis.GeoLocation{
		Name:      fmt.Sprintf("%d", personnelID),
		Longitude: x,
		Latitude:  y,
	}).Err()
}

func (r *RedisRepo) GetNearbyPersonnel(lng, lat float64, radius float64) ([]string, error) {
	results, err := r.client.GeoRadius(r.ctx, "personnel:geo", lng, lat, &redis.GeoRadiusQuery{
		Radius: radius,
		Unit:   "m",
	}).Result()
	if err != nil {
		return nil, err
	}
	var names []string
	for _, loc := range results {
		names = append(names, loc.Name)
	}
	return names, nil
}

func (r *RedisRepo) Close() error {
	return r.client.Close()
}
