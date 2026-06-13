package consul

import (
	"fmt"
	"log"
	"net"
	"strconv"
	"time"

	consulapi "github.com/hashicorp/consul/api"
)

type ConsulClient struct {
	client *consulapi.Client
}

func NewConsulClient(address string) (*ConsulClient, error) {
	config := consulapi.DefaultConfig()
	config.Address = address

	client, err := consulapi.NewClient(config)
	if err != nil {
		return nil, err
	}

	return &ConsulClient{client: client}, nil
}

func (c *ConsulClient) RegisterService(serviceName, serviceID, address string, port int, tags []string, healthCheckPath string) error {
	check := &consulapi.AgentServiceCheck{
		HTTP:                           fmt.Sprintf("http://%s:%d%s", address, port, healthCheckPath),
		Interval:                       "10s",
		Timeout:                        "5s",
		DeregisterCriticalServiceAfter: "30s",
	}

	registration := &consulapi.AgentServiceRegistration{
		Name:    serviceName,
		ID:      serviceID,
		Address: address,
		Port:    port,
		Tags:    tags,
		Check:   check,
	}

	err := c.client.Agent().ServiceRegister(registration)
	if err != nil {
		return fmt.Errorf("failed to register service: %v", err)
	}

	log.Printf("Service %s registered successfully with ID: %s", serviceName, serviceID)
	return nil
}

func (c *ConsulClient) DeregisterService(serviceID string) error {
	err := c.client.Agent().ServiceDeregister(serviceID)
	if err != nil {
		return fmt.Errorf("failed to deregister service: %v", err)
	}
	log.Printf("Service %s deregistered successfully", serviceID)
	return nil
}

func (c *ConsulClient) DiscoverService(serviceName string) (string, int, error) {
	services, _, err := c.client.Health().Service(serviceName, "", true, nil)
	if err != nil {
		return "", 0, fmt.Errorf("failed to discover service: %v", err)
	}

	if len(services) == 0 {
		return "", 0, fmt.Errorf("no healthy instances of service %s found", serviceName)
	}

	instance := services[0]
	return instance.Service.Address, instance.Service.Port, nil
}

func (c *ConsulClient) GetAllServices() (map[string]*consulapi.AgentService, error) {
	return c.client.Agent().Services()
}

func (c *ConsulClient) HealthCheck() error {
	leader, err := c.client.Status().Leader()
	if err != nil {
		return fmt.Errorf("consul health check failed: %v", err)
	}
	log.Printf("Consul leader: %s", leader)
	return nil
}

func GetOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func (c *ConsulClient) SetKV(key string, value string) error {
	p := &consulapi.KVPair{
		Key:   key,
		Value: []byte(value),
	}

	_, err := c.client.KV().Put(p, nil)
	return err
}

func (c *ConsulClient) GetKV(key string) (string, error) {
	pair, _, err := c.client.KV().Get(key, nil)
	if err != nil {
		return "", err
	}
	if pair == nil {
		return "", fmt.Errorf("key not found: %s", key)
	}
	return string(pair.Value), nil
}

func (c *ConsulClient) KeepAlive(serviceName, serviceID, address string, port int, stopChan chan struct{}) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-stopChan:
			log.Printf("Stopping keepalive for service %s", serviceID)
			return
		case <-ticker.C:
			services, err := c.GetAllServices()
			if err != nil {
				log.Printf("Error checking services: %v", err)
				continue
			}

			if _, exists := services[serviceID]; !exists {
				log.Printf("Service %s not found, re-registering...", serviceID)
				tags := []string{serviceName, "v1"}
				healthCheckPath := "/health"
				if err := c.RegisterService(serviceName, serviceID, address, port, tags, healthCheckPath); err != nil {
					log.Printf("Failed to re-register service: %v", err)
				}
			}
		}
	}
}

func ParsePort(portStr string) int {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return 8080
	}
	return port
}
