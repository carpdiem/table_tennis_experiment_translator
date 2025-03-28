// Global variables for chart instances
let worldFrameChart = null;
let paddleFrameChart = null;
let resultChart = null;
let finalResultChart = null;

// Global variables for constraints
let ballTrajAngle = 0;

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize empty charts
    initializeCharts();
    
    // Add event listeners to the input form fields
    const inputFields = ['v_ball', 'angle_ball', 'v_paddle', 'angle_paddle', 'closed_paddle'];
    inputFields.forEach(field => {
        document.getElementById(field).addEventListener('input', function() {
            // Add a small delay to prevent too many calculations while typing
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(function() {
                calculatePaddleFrame();
            }, 250);
        });
    });
    
    // Add event listeners to the experiment form fields
    const experimentFields = ['v_ball_after', 'angle_ball_after'];
    experimentFields.forEach(field => {
        document.getElementById(field).addEventListener('input', function() {
            // Add a small delay to prevent too many calculations while typing
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(function() {
                calculateWorldFrame();
            }, 250);
        });
    });
    
    // Calculate initial values on page load
    calculatePaddleFrame();
    
    // Use a short timeout to ensure calculatePaddleFrame completes first
    // This is important because calculatePaddleFrame sets ballTrajAngle which is used by calculateWorldFrame
    setTimeout(function() {
        calculateWorldFrame();
    }, 500);
});

// Initialize charts with empty data
function initializeCharts() {
    // World Frame Chart
    const worldCtx = document.getElementById('worldFrameCanvas').getContext('2d');
    worldFrameChart = new Chart(worldCtx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: getCommonChartOptions(1.8, {
            gridLines: false,
            borderWidth: 0.5
        })
    });
    
    // Paddle Frame Chart
    const paddleCtx = document.getElementById('paddleFrameCanvas').getContext('2d');
    paddleFrameChart = new Chart(paddleCtx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: getCommonChartOptions(1.0, {
            gridLines: false,
            borderWidth: 0.5
        })
    });
    
    // Result Chart
    const resultCtx = document.getElementById('resultCanvas').getContext('2d');
    resultChart = new Chart(resultCtx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: getCommonChartOptions(1.0, {
            gridLines: false,
            borderWidth: 0.5
        })
    });
    
    // Final Result Chart
    const finalResultCtx = document.getElementById('finalResultCanvas').getContext('2d');
    finalResultChart = new Chart(finalResultCtx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: getCommonChartOptions(1.8, {
            gridLines: false,
            borderWidth: 0.5
        })
    });
    
    // Initialize result and final result charts with placeholder data
    initializePlaceholderCharts();
}

// Add placeholder data to the result and final result charts
function initializePlaceholderCharts() {
    // Initialize result chart with minimal placeholder data
    resultChart.data.datasets = [
        {
            label: 'Paddle Surface',
            data: [{ x: -0.1, y: 0.75 }, { x: 0.1, y: 0.75 }],
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
        }
    ];
    resultChart.options.scales.x.min = -0.2;
    resultChart.options.scales.x.max = 0.2;
    resultChart.options.scales.y.min = 0.6;
    resultChart.options.scales.y.max = 0.9;
    resultChart.update();
    
    // Initialize final result chart with minimal placeholder data
    finalResultChart.data.datasets = [
        {
            label: 'Paddle Path',
            data: [{ x: -0.6, y: 0 }, { x: -0.4, y: 0 }],
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0
        }
    ];
    finalResultChart.options.scales.x.min = -0.7;
    finalResultChart.options.scales.x.max = -0.3;
    finalResultChart.options.scales.y.min = -0.1;
    finalResultChart.options.scales.y.max = 0.1;
    finalResultChart.update();
}

// Common chart options
function getCommonChartOptions(aspectRatio = 1.5, options = {}) {
    return {
        aspectRatio: aspectRatio,
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        layout: {
            padding: {
                top: 2,
                right: 2,
                bottom: 2,
                left: 2
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                ticks: {
                    display: false
                },
                grid: {
                    display: options.gridLines === true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    lineWidth: 0.5
                },
                border: {
                    display: options.borderWidth > 0,
                    width: options.borderWidth || 0
                }
            },
            y: {
                type: 'linear',
                position: 'left',
                ticks: {
                    display: false
                },
                grid: {
                    display: options.gridLines === true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    lineWidth: 0.5
                },
                border: {
                    display: options.borderWidth > 0,
                    width: options.borderWidth || 0
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        }
    };
}

// Calculate paddle frame results
function calculatePaddleFrame() {
    // Get input values
    const v_ball = parseFloat(document.getElementById('v_ball').value);
    const angle_ball = parseFloat(document.getElementById('angle_ball').value);
    const v_paddle = parseFloat(document.getElementById('v_paddle').value);
    const angle_paddle = parseFloat(document.getElementById('angle_paddle').value);
    const closed_paddle = parseFloat(document.getElementById('closed_paddle').value);
    
    // Validate inputs - silently return if any are invalid (during typing)
    if (isNaN(v_ball) || isNaN(angle_ball) || isNaN(v_paddle) || isNaN(angle_paddle) || isNaN(closed_paddle)) {
        return; // Skip calculation instead of showing an alert
    }
    
    // Prepare data for API call
    const data = {
        v_ball: v_ball,
        angle_ball: angle_ball,
        v_paddle: v_paddle,
        angle_paddle: angle_paddle,
        closed_paddle: closed_paddle
    };
    
    // Make API call
    axios.post('/calculate_paddle_frame', data)
        .then(response => {
            const result = response.data;
            
            // Save angle constraint for the experiment
            ballTrajAngle = result.ball_traj_angle;
            
            // Update the angle constraint text
            const angleConstraintElement = document.getElementById('angleConstraint');
            angleConstraintElement.textContent = `Range: ${(ballTrajAngle - 180).toFixed(1)}° to ${ballTrajAngle.toFixed(1)}°`;
            
            // Update the angle_ball_after input constraints
            const angleBallAfterInput = document.getElementById('angle_ball_after');
            angleBallAfterInput.min = ballTrajAngle - 180;
            angleBallAfterInput.max = ballTrajAngle;
            angleBallAfterInput.value = (ballTrajAngle - 45).toFixed(1);
            
            // Update paddle frame info text
            const paddleFrameInfo = document.getElementById('paddleFrameInfo');
            paddleFrameInfo.innerHTML = `
                <div class="info-box">
                    <span class="angle-info">θ: ${result.ball_traj_angle.toFixed(1)}°</span>
                    <span class="speed-info">v: ${result.ball_traj_speed.toFixed(2)} m/s</span>
                </div>
            `;
            
            // Update the visualization charts
            updateWorldFrameChart(result.visualization.world_frame);
            updatePaddleFrameChart(result.visualization.paddle_frame);
            
            // Show the experiment panel
            document.getElementById('experimentPanel').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while calculating. Check the console for details.');
        });
}

// Calculate world frame results
function calculateWorldFrame() {
    try {
        // Get initial input values
        const v_ball = parseFloat(document.getElementById('v_ball').value);
        const angle_ball = parseFloat(document.getElementById('angle_ball').value);
        const v_paddle = parseFloat(document.getElementById('v_paddle').value);
        const angle_paddle = parseFloat(document.getElementById('angle_paddle').value);
        const closed_paddle = parseFloat(document.getElementById('closed_paddle').value);
        
        // Get experiment input values
        const v_ball_after = parseFloat(document.getElementById('v_ball_after').value);
        const angle_ball_after = parseFloat(document.getElementById('angle_ball_after').value);
        
        // Validate inputs - silently return if any are invalid (during typing)
        if (isNaN(v_ball) || isNaN(angle_ball) || isNaN(v_paddle) || isNaN(angle_paddle) || 
            isNaN(closed_paddle) || isNaN(v_ball_after) || isNaN(angle_ball_after)) {
            return; // Skip calculation instead of showing an alert
        }
        
        // Check if angle is within allowed range - silently return if invalid
        if (angle_ball_after < ballTrajAngle - 180 || angle_ball_after > ballTrajAngle) {
            return; // Skip calculation instead of showing an alert
        }
        
        // Prepare data for API call
        const data = {
            v_ball: v_ball,
            angle_ball: angle_ball,
            v_paddle: v_paddle,
            angle_paddle: angle_paddle,
            closed_paddle: closed_paddle,
            v_ball_after: v_ball_after,
            angle_ball_after: angle_ball_after
        };
        
        console.log("Sending data to calculate_world_frame:", data);
        
        // Make API call
        axios.post('/calculate_world_frame', data)
            .then(response => {
                console.log("Response received:", response.data);
                const result = response.data;
                
                // Update result info
                const resultInfo = document.getElementById('resultInfo');
                resultInfo.innerHTML = `
                    <div class="info-box">
                        <span class="angle-info">θ: ${angle_ball_after.toFixed(1)}°</span>
                        <span class="speed-info">v: ${v_ball_after.toFixed(2)} m/s</span>
                    </div>
                `;
                
                // Update final result info
                const finalResultInfo = document.getElementById('finalResultInfo');
                finalResultInfo.innerHTML = `
                    <div class="info-box">
                        <span class="angle-info">θ: ${result.angle_ball_after_in_w.toFixed(1)}°</span>
                        <span class="speed-info">v: ${result.speed_ball_after_in_w.toFixed(2)} m/s</span>
                    </div>
                `;
                
                // Update the visualization charts
                updateResultChart(angle_ball_after);
                updateFinalResultChart(result.visualization.world_frame);
                
                // No need to show panels as they're already visible in the 2x2 grid layout
                // The following lines were causing the error:
                // document.getElementById('resultPanel').style.display = 'block';
                // document.getElementById('finalResultPanel').style.display = 'block';
            })
            .catch(error => {
                console.error('Error in calculateWorldFrame API call:', error);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                }
                alert('An error occurred while calculating the world frame results. Check the console for details.');
            });
    } catch (error) {
        console.error('Error in calculateWorldFrame function:', error);
        alert('An unexpected error occurred. Check the console for details.');
    }
}

// Update the world frame chart
function updateWorldFrameChart(data) {
    try {
        // Clear previous data
        worldFrameChart.data.datasets = [];
        
        // Find the collision point for better framing
        const x_p = data.x_p;
        const y_p = data.y_p;
        
        // Calculate the optimal scale window
        const paddleLength = 0.3; // Just enough to show the paddle face
        
        // Set appropriate axis ranges - tighter window focused on the collision
        const xWindow = 0.5; // Horizontal window size
        const yWindow = 0.3; // Vertical window size
        const xMin = x_p - xWindow * 0.4;
        const xMax = x_p + xWindow * 0.6;
        const yMin = y_p - yWindow * 0.4;
        const yMax = y_p + yWindow * 0.6;
        
        // Add light gray crosshairs in the background
        // Vertical line
        worldFrameChart.data.datasets.push({
            label: 'Vertical Reference',
            data: [
                { x: x_p, y: yMin },
                { x: x_p, y: yMax }
            ],
            showLine: true,
            borderColor: 'rgba(200, 200, 200, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            order: 10 // Higher order means it's drawn earlier (in the background)
        });
        
        // Horizontal line
        worldFrameChart.data.datasets.push({
            label: 'Horizontal Reference',
            data: [
                { x: xMin, y: y_p },
                { x: xMax, y: y_p }
            ],
            showLine: true,
            borderColor: 'rgba(200, 200, 200, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            order: 10 // Higher order means it's drawn earlier (in the background)
        });
        
        // Ball trajectory - trimmed to just the relevant portion
        const trajectory = trimTrajectory(data.x_ball_after, data.y_ball_after, 40);
        worldFrameChart.data.datasets.push({
            label: 'Ball Trajectory',
            data: trajectory.map((point) => ({ x: point.x, y: point.y })),
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        });
        
        // Add direction arrow in the middle of the ball trajectory
        if (trajectory.length > 0) {
            // Find middle point in the trajectory
            const midIndex = Math.floor(trajectory.length / 2);
            const midPoint = trajectory[midIndex];
            
            // Calculate direction based on surrounding points
            let directionAngle = 0;
            if (midIndex > 0 && midIndex < trajectory.length - 1) {
                directionAngle = Math.atan2(
                    trajectory[midIndex+1].y - trajectory[midIndex-1].y, 
                    trajectory[midIndex+1].x - trajectory[midIndex-1].x
                );
            }
            
            // Add an arrow at the midpoint
            worldFrameChart.data.datasets.push({
                label: 'Ball Direction',
                data: [{ x: midPoint.x, y: midPoint.y }],
                showLine: false,
                borderColor: '#4bc0c0',
                backgroundColor: '#4bc0c0',
                pointStyle: 'triangle',
                rotation: rad2deg(directionAngle) - 90, // Rotate to point in trajectory direction
                pointRadius: 4
            });
        }
        
        // Paddle path - shortened to just show what's relevant
        const paddleStart = { x: x_p, y: y_p };
        
        // Instead of calculating with atan2, use the direct angle value from user input
        const paddleAngleDeg = parseFloat(document.getElementById('angle_paddle').value);
        const paddleDirection = degToRad(paddleAngleDeg);
        
        const paddleEnd = { 
            x: x_p + paddleLength * Math.cos(paddleDirection),
            y: y_p + paddleLength * Math.sin(paddleDirection)
        };
        
        worldFrameChart.data.datasets.push({
            label: 'Paddle Path',
            data: [paddleStart, paddleEnd],
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0
        });
        
        // Add direction arrow in the middle of the paddle path
        const paddleMidPoint = {
            x: (paddleStart.x + paddleEnd.x) / 2,
            y: (paddleStart.y + paddleEnd.y) / 2
        };
        
        // If default orientation is with one vertex up,
        // rotate counterclockwise by (90° - paddle_trajectory_angle)
        // Note: In Chart.js, positive rotation values mean clockwise rotation,
        // so we'll use negative value for counterclockwise
        const triangleRotation = -(90 - paddleAngleDeg);
        
        worldFrameChart.data.datasets.push({
            label: 'Paddle Direction',
            data: [paddleMidPoint],
            showLine: false,
            borderColor: '#ff6384',
            backgroundColor: '#ff6384',
            pointStyle: 'triangle',
            rotation: triangleRotation,
            pointRadius: 5
        });
        
        // Paddle surface
        worldFrameChart.data.datasets.push({
            label: 'Paddle Surface',
            data: data.x_bat.map((x, i) => ({ x: x, y: data.y_bat[i] })),
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
        });
        
        // Ball position
        worldFrameChart.data.datasets.push({
            label: 'Ball',
            data: [{ x: x_p, y: y_p }],
            showLine: false,
            borderColor: '#4bc0c0',
            backgroundColor: '#4bc0c0',
            borderWidth: 0,
            pointRadius: 4
        });
        
        // Define variables for angle visualizations
        const radius = 0.07;
        const ballAngleDeg = parseFloat(document.getElementById('angle_ball').value);
        const ballAngleRad = degToRad(ballAngleDeg);
        
        // Reference line for horizontal
        const horizontalLinePoints = [
            { x: x_p - radius, y: y_p },
            { x: x_p, y: y_p }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Horizontal Reference',
            data: horizontalLinePoints,
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        // Generate arc points for ball angle - now in the third quadrant (bottom-left)
        const ballArcPoints = [];
        // For ball angle, create an arc from horizontal to the ball trajectory (in third quadrant)
        const ballAngleStart = Math.PI; // Start from negative x-axis
        const ballAngleEnd = Math.PI + ballAngleRad; // End at ball trajectory
        
        for (let i = 0; i <= 20; i++) {
            const angle = ballAngleStart + (i * (ballAngleRad / 20));
            ballArcPoints.push({
                x: x_p + radius * Math.cos(angle),
                y: y_p + radius * Math.sin(angle)
            });
        }
        
        // Add a point on the ball trajectory line to clearly show angle connection
        const ballTrajPoint = {
            x: x_p + radius * Math.cos(ballAngleEnd),
            y: y_p + radius * Math.sin(ballAngleEnd)
        };
        
        const ballTrajLine = [
            { x: x_p, y: y_p },
            { x: ballTrajPoint.x, y: ballTrajPoint.y }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Ball Trajectory Reference',
            data: ballTrajLine,
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        worldFrameChart.data.datasets.push({
            label: 'Ball Angle',
            data: ballArcPoints,
            showLine: true,
            borderColor: '#4bc0c0', // Match ball angle color
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3], // Adding dashed line style for cleaner look
            pointRadius: 0
        });
        
        // Add paddle angle arc
        const paddleAngleRad = degToRad(paddleAngleDeg);
        
        // Reference line for horizontal (paddle side)
        const horizontalPaddleLine = [
            { x: x_p, y: y_p },
            { x: x_p + radius, y: y_p }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Horizontal Paddle Reference',
            data: horizontalPaddleLine,
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        // Generate arc points for paddle angle - now in the fourth quadrant (bottom-right)
        const paddleArcPoints = [];
        // For paddle angle, create an arc from horizontal to the paddle angle
        const paddleAngleStart = 0; // Start from positive x-axis
        const paddleAngleEnd = 2*Math.PI - paddleAngleRad; // End at paddle trajectory in fourth quadrant
        
        for (let i = 0; i <= 20; i++) {
            const angle = paddleAngleStart - (i * (paddleAngleRad / 20));
            paddleArcPoints.push({
                x: x_p + radius * Math.cos(angle),
                y: y_p + radius * Math.sin(angle)
            });
        }
        
        // Add a point on the paddle trajectory line to clearly show angle connection
        const paddleTrajPoint = {
            x: x_p + radius * Math.cos(paddleAngleEnd),
            y: y_p + radius * Math.sin(paddleAngleEnd)
        };
        
        const paddleTrajLine = [
            { x: x_p, y: y_p },
            { x: paddleTrajPoint.x, y: paddleTrajPoint.y }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Paddle Trajectory Reference',
            data: paddleTrajLine,
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        worldFrameChart.data.datasets.push({
            label: 'Paddle Angle',
            data: paddleArcPoints,
            showLine: true,
            borderColor: '#ff6384', // Match paddle angle color
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [3, 3], // Adding dashed line style for cleaner look
            pointRadius: 0
        });
        
        // Add closure angle arc
        const closureAngleDeg = parseFloat(document.getElementById('closed_paddle').value);
        const closureAngleRad = degToRad(closureAngleDeg);
        
        // Calculate paddle surface angle relative to vertical y-axis
        // The paddle face angle is measured relative to the vertical (PI/2)
        // Positive closure angle tilts the paddle face left from vertical (counterclockwise)
        // Negative closure angle tilts the paddle face right from vertical (clockwise)
        const paddleFaceAngle = Math.PI/2 + closureAngleRad;
        
        // Reference line for vertical (paddle side)
        const verticalPaddleLine = [
            { x: x_p, y: y_p },
            { x: x_p, y: y_p + radius }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Vertical Paddle Reference',
            data: verticalPaddleLine,
            showLine: true,
            borderColor: '#ffcd56',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        // Draw a line representing the paddle face
        const paddleFaceLine = [
            { x: x_p, y: y_p },
            { x: x_p + (radius * 0.8) * Math.cos(paddleFaceAngle), 
              y: y_p + (radius * 0.8) * Math.sin(paddleFaceAngle) }
        ];
        
        worldFrameChart.data.datasets.push({
            label: 'Paddle Face',
            data: paddleFaceLine,
            showLine: true,
            borderColor: '#ffcd56',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        // Starting from y-axis (PI/2), draw arc to the paddle face angle
        const startAngle = Math.PI/2; // Vertical y-axis
        
        // Generate the arc points
        const closureArcPoints = [];
        
        // Start from vertical (PI/2) and go to the paddle face angle
        // The direction and amount depend on the sign and magnitude of the closure angle
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            // Direct calculation ensures arc moves to the correct side based on closure angle sign
            const angle = startAngle + t * closureAngleRad;
            closureArcPoints.push({
                x: x_p + (radius * 0.8) * Math.cos(angle),
                y: y_p + (radius * 0.8) * Math.sin(angle)
            });
        }
        
        worldFrameChart.data.datasets.push({
            label: 'Closure Angle',
            data: closureArcPoints,
            showLine: true,
            borderColor: '#ffcd56', // Match closure angle color
            backgroundColor: 'transparent',
            borderWidth: 1, 
            borderDash: [3, 3], // Adding dashed line style for cleaner look
            pointRadius: 0
        });
        
        // Set appropriate axis ranges - tighter window focused on the collision
        worldFrameChart.options.scales.x.min = xMin;
        worldFrameChart.options.scales.x.max = xMax;
        worldFrameChart.options.scales.y.min = yMin;
        worldFrameChart.options.scales.y.max = yMax;
        
        // Update chart
        worldFrameChart.update();
    } catch (error) {
        console.error('Error in updateWorldFrameChart:', error);
    }
}

// Helper function to trim trajectory to show only the relevant part
function trimTrajectory(xValues, yValues, points) {
    if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
        console.error('Invalid trajectory data:', { xValues, yValues });
        return [];
    }
    
    const result = [];
    // Take the last 'points' points from the trajectory
    const startIndex = Math.max(0, xValues.length - points);
    for (let i = startIndex; i < xValues.length; i++) {
        result.push({ x: xValues[i], y: yValues[i] });
    }
    return result;
}

// Update the paddle frame chart
function updatePaddleFrameChart(data) {
    try {
        // Clear previous data
        paddleFrameChart.data.datasets = [];
        
        // Constants for better visualization
        const paddleY = 0.75; // Center of paddle
        const ballPath = 0.35; // Length of ball path
        const paddleWidth = 0.15; // Width of paddle
        
        // Ball path - incoming (vertical line with arrow)
        paddleFrameChart.data.datasets.push({
            label: 'Ball Path',
            data: [{ x: 0, y: paddleY - ballPath }, { x: 0, y: paddleY }],
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        });
        
        // Paddle surface
        paddleFrameChart.data.datasets.push({
            label: 'Paddle Surface',
            data: [
                { x: -paddleWidth / 2.0 * Math.sin(degToRad(ballTrajAngle)), y: paddleY - paddleWidth / 2.0 * Math.cos(degToRad(ballTrajAngle)) },
                { x: paddleWidth / 2.0 * Math.sin(degToRad(ballTrajAngle)), y: paddleY + paddleWidth / 2.0 * Math.cos(degToRad(ballTrajAngle)) }
            ],
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
        });
        
        // Ball
        paddleFrameChart.data.datasets.push({
            label: 'Ball',
            data: [{ x: 0, y: paddleY - 0.2 }],
            showLine: false,
            borderColor: '#4bc0c0',
            backgroundColor: '#4bc0c0',
            borderWidth: 0,
            pointRadius: 4
        });
        
        // Angle arc
        if (ballTrajAngle !== 0) {
            const arcPoints = Math.max(20, Math.min(50, Math.abs(ballTrajAngle))); // Scale points based on angle size
            const arcRadius = paddleWidth / 3.0; // Smaller radius for a cleaner look
            const thetaPoints = [];
            
            for (let i = 0; i <= arcPoints; i++) {
                const angle = (ballTrajAngle * i) / arcPoints;
                thetaPoints.push({
                    x: -arcRadius * Math.sin(degToRad(angle)),
                    y: paddleY - arcRadius * Math.cos(degToRad(angle))
                });
            }
            
            paddleFrameChart.data.datasets.push({
                label: 'Angle Arc',
                data: thetaPoints,
                showLine: true,
                borderColor: '#ff6384',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [2, 2],
                pointRadius: 0
            });
            
            // Add angle label
            if (Math.abs(ballTrajAngle) > 3) {
                const labelPosition = ballTrajAngle / 2;
                const labelDist = arcRadius * 1.3;
                paddleFrameChart.data.datasets.push({
                    label: 'Angle Label',
                    data: [{
                        x: -labelDist * Math.sin(degToRad(labelPosition)),
                        y: paddleY - labelDist * Math.cos(degToRad(labelPosition))
                    }],
                    showLine: false,
                    pointRadius: 0,
                    pointStyle: 'circle'
                });
            }
        }
        
        // Set appropriate axis ranges
        const xRange = 0.2;
        const yRange = 0.25;
        paddleFrameChart.options.scales.x.min = -xRange;
        paddleFrameChart.options.scales.x.max = xRange;
        paddleFrameChart.options.scales.y.min = paddleY - yRange;
        paddleFrameChart.options.scales.y.max = paddleY + yRange * 0.5;
        
        // Update chart
        paddleFrameChart.update();
    } catch (error) {
        console.error('Error in updatePaddleFrameChart:', error);
    }
}

// Convert degrees to radians
function degToRad(deg) {
    return (Math.PI / 180.0) * deg;
}

// Update the result chart
function updateResultChart(angle_ball_after) {
    try {
        // Clear previous data
        resultChart.data.datasets = [];
        
        // Constants for better visualization
        const paddleY = 0.75; // Center of paddle
        const ballPath = 0.25; // Length of ball path
        const paddleWidth = 0.15; // Width of paddle
        
        // Ball before (incoming) - shorter path
        resultChart.data.datasets.push({
            label: 'Ball Before',
            data: [{ x: 0, y: paddleY - ballPath }, { x: 0, y: paddleY }],
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0
        });
        
        // Paddle surface
        resultChart.data.datasets.push({
            label: 'Paddle Surface',
            data: [
                { x: -paddleWidth / 2.0 * Math.sin(degToRad(ballTrajAngle)), y: paddleY - paddleWidth / 2.0 * Math.cos(degToRad(ballTrajAngle)) },
                { x: paddleWidth / 2.0 * Math.sin(degToRad(ballTrajAngle)), y: paddleY + paddleWidth / 2.0 * Math.cos(degToRad(ballTrajAngle)) }
            ],
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
        });
        
        // Ball after (outgoing) - optimal length
        const outgoingLength = 0.3;
        resultChart.data.datasets.push({
            label: 'Ball After',
            data: [
                { x: 0, y: paddleY },
                { x: -outgoingLength * Math.sin(degToRad(angle_ball_after)), 
                  y: paddleY - outgoingLength * Math.cos(degToRad(angle_ball_after)) }
            ],
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        });
        
        // Ball
        const ballEndX = -outgoingLength * Math.sin(degToRad(angle_ball_after));
        const ballEndY = paddleY - outgoingLength * Math.cos(degToRad(angle_ball_after));
        resultChart.data.datasets.push({
            label: 'Ball',
            data: [{ x: ballEndX, y: ballEndY }],
            showLine: false,
            borderColor: '#4bc0c0',
            backgroundColor: '#4bc0c0',
            borderWidth: 0,
            pointRadius: 4
        });
        
        // Angle arc - more elegant with fewer points
        const arcPoints = Math.max(20, Math.min(40, Math.abs(angle_ball_after))); // Scale points based on angle size
        const arcRadius = outgoingLength / 2.0;
        const betaPoints = [];
        
        for (let i = 0; i <= arcPoints; i++) {
            const angle = (angle_ball_after * i) / arcPoints;
            betaPoints.push({
                x: -arcRadius * Math.sin(degToRad(angle)),
                y: paddleY - arcRadius * Math.cos(degToRad(angle))
            });
        }
        
        resultChart.data.datasets.push({
            label: 'Angle Arc',
            data: betaPoints,
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 0.8,
            borderDash: [2, 2],
            pointRadius: 0
        });
        
        // Set appropriate axis ranges
        const xWindow = Math.max(0.25, Math.abs(ballEndX) * 1.4);
        const yWindow = 0.3;
        resultChart.options.scales.x.min = -xWindow;
        resultChart.options.scales.x.max = xWindow / 3;
        resultChart.options.scales.y.min = paddleY - yWindow;
        resultChart.options.scales.y.max = paddleY + yWindow / 3;
        
        // Update chart
        resultChart.update();
    } catch (error) {
        console.error('Error in updateResultChart:', error);
    }
}

// Update the final result chart
function updateFinalResultChart(data) {
    try {
        // Clear previous data
        finalResultChart.data.datasets = [];
        
        // Find the collision point for better framing
        const x_p = data.x_p;
        const y_p = data.y_p;
        
        // Ensure x_ball_after and y_ball_after arrays exist
        if (!Array.isArray(data.x_ball_after) || !Array.isArray(data.y_ball_after)) {
            console.error('Invalid ball trajectory data:', data);
            return;
        }
        
        // Ball trajectory (before impact) - trimmed
        const beforeTrajectory = trimTrajectory(data.x_ball_after, data.y_ball_after, 30);
        finalResultChart.data.datasets.push({
            label: 'Ball Trajectory (Before)',
            data: beforeTrajectory.map(point => ({ x: point.x, y: point.y })),
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        });
        
        // Paddle surface
        finalResultChart.data.datasets.push({
            label: 'Paddle Surface',
            data: data.x_bat.map((x, i) => ({ x: x, y: data.y_bat[i] })),
            showLine: true,
            borderColor: '#ff6384',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0
        });
        
        // Ensure x_f and y_f arrays exist
        if (!Array.isArray(data.x_f) || !Array.isArray(data.y_f)) {
            console.error('Invalid final trajectory data:', data);
            return;
        }
        
        // Ball trajectory (after impact) - trimmed to optimal length
        // Find a good portion of the trajectory
        let afterTrajectory = [];
        const afterPoints = Math.min(data.x_f.length, 40); // Limit points for cleaner look
        
        for (let i = 0; i < afterPoints; i++) {
            afterTrajectory.push({ 
                x: data.x_f[i], 
                y: data.y_f[i] 
            });
        }
        
        finalResultChart.data.datasets.push({
            label: 'Ball Trajectory (After)',
            data: afterTrajectory,
            showLine: true,
            borderColor: '#4bc0c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        });
        
        // Ball at collision
        finalResultChart.data.datasets.push({
            label: 'Ball (At Collision)',
            data: [{ x: x_p, y: y_p }],
            showLine: false,
            borderColor: '#4bc0c0',
            backgroundColor: '#4bc0c0',
            borderWidth: 0,
            pointRadius: 4
        });
        
        // Ball at end of trajectory
        if (afterTrajectory.length > 0) {
            finalResultChart.data.datasets.push({
                label: 'Ball (After)',
                data: [{ x: afterTrajectory[afterTrajectory.length-1].x, y: afterTrajectory[afterTrajectory.length-1].y }],
                showLine: false,
                borderColor: '#4bc0c0',
                backgroundColor: '#4bc0c0',
                borderWidth: 0,
                pointRadius: 4
            });
        }
        
        // Calculate optimal window based on trajectories
        let allX = [...beforeTrajectory.map(p => p.x)];
        let allY = [...beforeTrajectory.map(p => p.y)];
        
        if (afterTrajectory.length > 0) {
            allX = [...allX, ...afterTrajectory.map(p => p.x)];
            allY = [...allY, ...afterTrajectory.map(p => p.y)];
        }
        
        if (allX.length === 0 || allY.length === 0) {
            console.error('No valid points for final chart', { beforeTrajectory, afterTrajectory });
            return;
        }
        
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);
        
        const xRange = maxX - minX;
        const yRange = maxY - minY;
        const paddingX = xRange * 0.1;
        const paddingY = yRange * 0.1;
        
        // Set appropriate axis ranges with padding
        finalResultChart.options.scales.x.min = minX - paddingX;
        finalResultChart.options.scales.x.max = maxX + paddingX;
        finalResultChart.options.scales.y.min = minY - paddingY;
        finalResultChart.options.scales.y.max = maxY + paddingY;
        
        // Update chart
        finalResultChart.update();
    } catch (error) {
        console.error('Error in updateFinalResultChart:', error, data);
    }
}

// Convert radians to degrees
function rad2deg(rad) {
    return (180.0 / Math.PI) * rad;
}
