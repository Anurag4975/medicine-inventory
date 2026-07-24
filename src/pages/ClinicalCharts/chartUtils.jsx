// src/pages/ClinicalCharts/chartUtils.js
export const generateBPData = (days = 7) => {
  const data = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      systolic: Math.floor(Math.random() * 40) + 110,
      diastolic: Math.floor(Math.random() * 30) + 70,
    });
  }
  return data.reverse();
};

export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};
