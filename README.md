# Table Tennis Experiment Calculator

An interactive web application for modeling and visualizing table tennis physics. This tool helps visualize and calculate the relationships between paddle angles, ball trajectories, and impact outcomes in table tennis.

## Features

- **World Frame Visualization:** Shows ball and paddle trajectories with directional indicators
- **Paddle Frame Visualization:** Displays ball trajectory from the paddle's perspective
- **Interactive Controls:** Adjust ball speed, angles, and paddle parameters to see real-time results
- **Shot Outcome Visualization:** Visualizes the resulting ball trajectory after impact

## Setup and Installation

1. Clone the repository:
```
git clone https://github.com/[your-username]/table-tennis-experiment-calculator.git
```

2. Navigate to the project directory:
```
cd table-tennis-experiment-calculator
```

3. Install the required dependencies:
```
pip install flask numpy
```

4. Run the Flask application:
```
cd web_app
python app.py
```

5. Open your browser and navigate to:
```
http://127.0.0.1:5018
```

## Technology Stack

- **Backend:** Flask (Python)
- **Frontend:** JavaScript, Chart.js
- **Physics Calculations:** NumPy

## Usage

1. Adjust the input parameters using the sliders:
   - Ball velocity and angle
   - Paddle velocity and angle
   - Paddle closure angle

2. The visualizations will update in real-time to show:
   - Ball and paddle trajectories in world frame
   - Ball trajectory in paddle frame
   - Resulting trajectories after impact

3. Experiment with different configurations to understand how various factors affect the shot outcome.

## License

[MIT License](LICENSE)
