package machine_learning

import (
	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/utils"
	"math"

	"gonum.org/v1/gonum/stat"
)

// Predictor 故障预测器
type Predictor struct {
	// 各指标权重
	tempWeight      float64
	vibrationWeight float64
	pressureWeight  float64
	currentWeight   float64
}

// GlobalPredictor 全局预测器实例
var GlobalPredictor = &Predictor{
	tempWeight:      0.30,
	vibrationWeight: 0.30,
	pressureWeight:  0.20,
	currentWeight:   0.20,
}

// calculateTempScore 计算温度得分（0-100，越接近100越危险）
func (p *Predictor) calculateTempScore(temp float64) float64 {
	ml := config.GlobalConfig.ML
	if temp <= ml.TempWarning {
		return 20.0
	} else if temp <= ml.TempDanger {
		ratio := (temp - ml.TempWarning) / (ml.TempDanger - ml.TempWarning)
		return 30 + ratio*40
	} else {
		overRatio := (temp - ml.TempDanger) / ml.TempDanger
		score := 75 + math.Min(overRatio*100, 25)
		return math.Min(score, 100)
	}
}

// calculateVibrationScore 计算振动得分
func (p *Predictor) calculateVibrationScore(vibration float64) float64 {
	ml := config.GlobalConfig.ML
	if vibration <= ml.VibrationWarning {
		return 20.0
	} else if vibration <= ml.VibrationDanger {
		ratio := (vibration - ml.VibrationWarning) / (ml.VibrationDanger - ml.VibrationWarning)
		return 30 + ratio*40
	} else {
		overRatio := (vibration - ml.VibrationDanger) / ml.VibrationDanger
		score := 75 + math.Min(overRatio*100, 25)
		return math.Min(score, 100)
	}
}

// calculatePressureScore 计算压力得分
func (p *Predictor) calculatePressureScore(pressure float64) float64 {
	ml := config.GlobalConfig.ML
	if pressure <= ml.PressureWarning {
		return 20.0
	} else if pressure <= ml.PressureDanger {
		ratio := (pressure - ml.PressureWarning) / (ml.PressureDanger - ml.PressureWarning)
		return 30 + ratio*40
	} else {
		overRatio := (pressure - ml.PressureDanger) / ml.PressureDanger
		score := 75 + math.Min(overRatio*100, 25)
		return math.Min(score, 100)
	}
}

// calculateCurrentScore 计算电流得分
func (p *Predictor) calculateCurrentScore(current float64) float64 {
	ml := config.GlobalConfig.ML
	if current <= ml.CurrentWarning {
		return 20.0
	} else if current <= ml.CurrentDanger {
		ratio := (current - ml.CurrentWarning) / (ml.CurrentDanger - ml.CurrentWarning)
		return 30 + ratio*40
	} else {
		overRatio := (current - ml.CurrentDanger) / ml.CurrentDanger
		score := 75 + math.Min(overRatio*100, 25)
		return math.Min(score, 100)
	}
}

// calculateTrendScore 计算趋势得分（基于历史数据趋势）
func (p *Predictor) calculateTrendScore(history []models.DeviceData) float64 {
	if len(history) < 5 {
		return 0
	}

	n := len(history)
	temps := make([]float64, n)
	vibrations := make([]float64, n)
	currents := make([]float64, n)

	for i, d := range history {
		temps[i] = d.Temp
		vibrations[i] = d.Vibration
		currents[i] = d.Current
	}

	xs := make([]float64, n)
	for i := 0; i < n; i++ {
		xs[i] = float64(i)
	}

	tempSlope, _ := stat.LinearRegression(xs, temps, nil, false)
	vibSlope, _ := stat.LinearRegression(xs, vibrations, nil, false)
	curSlope, _ := stat.LinearRegression(xs, currents, nil, false)

	trendScore := 0.0
	if tempSlope > 0 {
		trendScore += math.Min(tempSlope*50, 20)
	}
	if vibSlope > 0 {
		trendScore += math.Min(vibSlope*20, 20)
	}
	if curSlope > 0 {
		trendScore += math.Min(curSlope*20, 20)
	}

	return math.Min(trendScore, 25)
}

// getRiskLevel 根据故障概率获取风险等级
func (p *Predictor) getRiskLevel(probability float64) string {
	switch {
	case probability < 30:
		return "低风险"
	case probability < 60:
		return "中风险"
	case probability < 80:
		return "高风险"
	default:
		return "极高风险"
	}
}

// getRecommendations 根据风险因素生成建议
func (p *Predictor) getRecommendations(factors []string) []string {
	recommendations := make([]string, 0)

	for _, factor := range factors {
		switch factor {
		case "温度过高":
			recommendations = append(recommendations, "检查冷却系统，清理散热片，检查润滑油")
		case "温度持续上升":
			recommendations = append(recommendations, "密切监控温度变化趋势，准备停机检修")
		case "振动异常":
			recommendations = append(recommendations, "检查轴承磨损，检查设备对齐状态，检查紧固件")
		case "振动持续增加":
			recommendations = append(recommendations, "振动加剧，建议尽快安排详细检查")
		case "压力异常":
			recommendations = append(recommendations, "检查管道堵塞，检查阀门状态，检查密封圈")
		case "电流异常":
			recommendations = append(recommendations, "检查电路负载，检查电机绕组，检查电源稳定性")
		case "电流持续增加":
			recommendations = append(recommendations, "负载持续增加，存在过载风险，建议检查机械部件")
		}
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "设备运行正常，继续保持定期巡检")
	}

	return recommendations
}

// PredictDeviceFault 预测设备故障概率
func (p *Predictor) PredictDeviceFault(deviceID uint, latestData models.DeviceData, history []models.DeviceData) models.PredictionResult {
	tempScore := p.calculateTempScore(latestData.Temp)
	vibrationScore := p.calculateVibrationScore(latestData.Vibration)
	pressureScore := p.calculatePressureScore(latestData.Pressure)
	currentScore := p.calculateCurrentScore(latestData.Current)
	trendScore := p.calculateTrendScore(history)

	weightedScore := tempScore*p.tempWeight +
		vibrationScore*p.vibrationWeight +
		pressureScore*p.pressureWeight +
		currentScore*p.currentWeight

	baseProbability := weightedScore
	probability := baseProbability*0.8 + trendScore*0.2

	probability = math.Max(0, math.Min(100, probability))

	factors := make([]string, 0)
	ml := config.GlobalConfig.ML

	if latestData.Temp > ml.TempWarning {
		factors = append(factors, "温度过高")
	}
	if latestData.Vibration > ml.VibrationWarning {
		factors = append(factors, "振动异常")
	}
	if latestData.Pressure > ml.PressureWarning {
		factors = append(factors, "压力异常")
	}
	if latestData.Current > ml.CurrentWarning {
		factors = append(factors, "电流异常")
	}

	if len(history) >= 5 {
		n := len(history)
		recentTemps := make([]float64, n)
		recentVibs := make([]float64, n)
		recentCurs := make([]float64, n)
		xs := make([]float64, n)
		for i, d := range history {
			recentTemps[i] = d.Temp
			recentVibs[i] = d.Vibration
			recentCurs[i] = d.Current
			xs[i] = float64(i)
		}

		tempSlope, _ := stat.LinearRegression(xs, recentTemps, nil, false)
		vibSlope, _ := stat.LinearRegression(xs, recentVibs, nil, false)
		curSlope, _ := stat.LinearRegression(xs, recentCurs, nil, false)

		if tempSlope > 0.3 {
			factors = append(factors, "温度持续上升")
		}
		if vibSlope > 0.1 {
			factors = append(factors, "振动持续增加")
		}
		if curSlope > 0.2 {
			factors = append(factors, "电流持续增加")
		}
	}

	result := models.PredictionResult{
		DeviceID:         deviceID,
		FaultProbability: math.Round(probability*100) / 100,
		RiskLevel:        p.getRiskLevel(probability),
		Factors:          factors,
		Recommendations:  p.getRecommendations(factors),
	}

	utils.AppLogger.Infof("设备[%d]故障预测完成 - 概率:%.2f%% 等级:%s 因素:%v",
		deviceID, result.FaultProbability, result.RiskLevel, result.Factors)

	return result
}

// BatchPredictDevices 批量预测设备故障
func (p *Predictor) BatchPredictDevices(deviceDataMap map[uint][]models.DeviceData) []models.PredictionResult {
	results := make([]models.PredictionResult, 0, len(deviceDataMap))

	for deviceID, dataList := range deviceDataMap {
		if len(dataList) == 0 {
			continue
		}
		latestData := dataList[len(dataList)-1]
		result := p.PredictDeviceFault(deviceID, latestData, dataList)
		results = append(results, result)
	}

	utils.AppLogger.Infof("批量故障预测完成，共处理%d台设备", len(results))
	return results
}
