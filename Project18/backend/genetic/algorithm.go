package genetic

import (
	"delivery-optimizer/models"
	"math"
	"math/rand"
	"sort"
	"time"
)

type Location struct {
	ID        uint
	Latitude  float64
	Longitude float64
	Weight    float64
	Priority  int
}

type Chromosome struct {
	Orders   []int
	Fitness  float64
	Distance float64
}

func Haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371.0
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func CalculateDistanceMatrix(warehouse models.Warehouse, orders []models.Order) [][]float64 {
	n := len(orders) + 1
	matrix := make([][]float64, n)
	for i := range matrix {
		matrix[i] = make([]float64, n)
	}

	locations := make([]Location, n)
	locations[0] = Location{
		ID:        warehouse.ID,
		Latitude:  warehouse.Latitude,
		Longitude: warehouse.Longitude,
	}
	for i, order := range orders {
		locations[i+1] = Location{
			ID:        order.ID,
			Latitude:  order.Latitude,
			Longitude: order.Longitude,
			Weight:    order.Weight,
			Priority:  order.Priority,
		}
	}

	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			if i != j {
				matrix[i][j] = Haversine(
					locations[i].Latitude, locations[i].Longitude,
					locations[j].Latitude, locations[j].Longitude,
				)
			}
		}
	}
	return matrix
}

func OptimizeRoutes(
	warehouse models.Warehouse,
	orders []models.Order,
	vehicles []models.Vehicle,
	generations int,
	populationSize int,
) map[uint][]models.Order {
	if len(orders) == 0 || len(vehicles) == 0 {
		return make(map[uint][]models.Order)
	}

	rand.Seed(time.Now().UnixNano())

	distanceMatrix := CalculateDistanceMatrix(warehouse, orders)
	vehicleCount := len(vehicles)

	if generations <= 0 {
		generations = 500
	}
	if populationSize <= 0 {
		populationSize = 100
	}

	population := initializePopulation(len(orders), vehicleCount, populationSize)

	for gen := 0; gen < generations; gen++ {
		evaluatePopulation(population, distanceMatrix, orders, vehicles)

		sort.Slice(population, func(i, j int) bool {
			return population[i].Fitness < population[j].Fitness
		})

		newPopulation := make([]Chromosome, 0, populationSize)
		eliteCount := populationSize / 10
		newPopulation = append(newPopulation, population[:eliteCount]...)

		for len(newPopulation) < populationSize {
			parent1 := tournamentSelection(population)
			parent2 := tournamentSelection(population)
			child := crossover(parent1, parent2, len(orders))
			child = mutate(child, 0.1)
			newPopulation = append(newPopulation, child)
		}

		population = newPopulation
	}

	evaluatePopulation(population, distanceMatrix, orders, vehicles)
	sort.Slice(population, func(i, j int) bool {
		return population[i].Fitness < population[j].Fitness
	})

	best := population[0]
	result := make(map[uint][]models.Order)
	vehicleOrders := distributeOrders(best.Orders, orders, vehicleCount)

	for i, vOrders := range vehicleOrders {
		if i < len(vehicles) {
			result[vehicles[i].ID] = vOrders
		}
	}

	return result
}

func initializePopulation(orderCount, vehicleCount, populationSize int) []Chromosome {
	population := make([]Chromosome, populationSize)
	for i := range population {
		orders := make([]int, orderCount)
		for j := range orders {
			orders[j] = j
		}
		rand.Shuffle(len(orders), func(i, j int) {
			orders[i], orders[j] = orders[j], orders[i]
		})
		population[i] = Chromosome{Orders: orders}
	}
	return population
}

func evaluatePopulation(population []Chromosome, matrix [][]float64, orders []models.Order, vehicles []models.Vehicle) {
	vehicleCount := len(vehicles)
	for i := range population {
		vehicleOrders := distributeOrders(population[i].Orders, orders, vehicleCount)
		totalDistance := 0.0
		capacityPenalty := 0.0

		for vIdx, vOrders := range vehicleOrders {
			capacity := 1000.0
			if vIdx < len(vehicles) {
				capacity = vehicles[vIdx].Capacity
			}

			currentWeight := 0.0
			routeDistance := 0.0
			prevNode := 0

			for _, order := range vOrders {
				idx := findOrderIndex(orders, order.ID) + 1
				routeDistance += matrix[prevNode][idx]
				prevNode = idx
				currentWeight += order.Weight
			}
			routeDistance += matrix[prevNode][0]
			totalDistance += routeDistance

			if currentWeight > capacity {
				capacityPenalty += (currentWeight - capacity) * 10
			}
		}

		population[i].Distance = totalDistance
		population[i].Fitness = totalDistance + capacityPenalty
	}
}

func findOrderIndex(orders []models.Order, id uint) int {
	for i, o := range orders {
		if o.ID == id {
			return i
		}
	}
	return -1
}

func distributeOrders(orderIndices []int, orders []models.Order, vehicleCount int) [][]models.Order {
	result := make([][]models.Order, vehicleCount)
	if len(orders) == 0 {
		return result
	}

	ordersPerVehicle := (len(orderIndices) + vehicleCount - 1) / vehicleCount
	for i, idx := range orderIndices {
		vIdx := i / ordersPerVehicle
		if vIdx >= vehicleCount {
			vIdx = vehicleCount - 1
		}
		result[vIdx] = append(result[vIdx], orders[idx])
	}
	return result
}

func tournamentSelection(population []Chromosome) Chromosome {
	tournamentSize := 5
	best := population[rand.Intn(len(population))]
	for i := 1; i < tournamentSize; i++ {
		candidate := population[rand.Intn(len(population))]
		if candidate.Fitness < best.Fitness {
			best = candidate
		}
	}
	return best
}

func crossover(parent1, parent2 Chromosome, orderCount int) Chromosome {
	if orderCount < 2 {
		return Chromosome{Orders: append([]int{}, parent1.Orders...)}
	}

	start := rand.Intn(orderCount)
	end := rand.Intn(orderCount-start) + start

	childOrders := make([]int, orderCount)
	for i := range childOrders {
		childOrders[i] = -1
	}

	used := make(map[int]bool)
	for i := start; i <= end; i++ {
		childOrders[i] = parent1.Orders[i]
		used[parent1.Orders[i]] = true
	}

	ptr := 0
	for _, val := range parent2.Orders {
		if !used[val] {
			for childOrders[ptr] != -1 {
				ptr++
			}
			childOrders[ptr] = val
			used[val] = true
		}
	}

	return Chromosome{Orders: childOrders}
}

func mutate(chromosome Chromosome, mutationRate float64) Chromosome {
	orders := append([]int{}, chromosome.Orders...)
	if len(orders) < 2 {
		return Chromosome{Orders: orders}
	}

	for i := range orders {
		if rand.Float64() < mutationRate {
			j := rand.Intn(len(orders))
			orders[i], orders[j] = orders[j], orders[i]
		}
	}
	return Chromosome{Orders: orders}
}
