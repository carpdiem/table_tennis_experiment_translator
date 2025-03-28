from flask import Flask, render_template, request, jsonify
import numpy as np
import math

app = Flask(__name__)

def deg2rad(deg):
    """Convert degrees to radians."""
    return np.pi / 180.0 * deg

def rad2deg(rad):
    """Convert radians to degrees."""
    return 180.0 / np.pi * rad

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/calculate_paddle_frame', methods=['POST'])
def calculate_paddle_frame():
    """Calculate shot parameters in paddle's reference frame."""
    data = request.json
    
    # Extract parameters
    v_ball = float(data['v_ball'])
    angle_ball = float(data['angle_ball'])
    v_paddle = float(data['v_paddle'])
    angle_paddle = float(data['angle_paddle'])
    closed_paddle = float(data['closed_paddle'])
    
    # In the world's reference frame
    ball_vec = np.array([
        [v_ball * np.cos(deg2rad(angle_ball))],
        [v_ball * np.sin(deg2rad(angle_ball))]
    ])
    
    paddle_vec = np.array([
        [-v_paddle * np.cos(deg2rad(angle_paddle))],
        [v_paddle * np.sin(deg2rad(angle_paddle))]
    ])
    
    # Move vectors to paddle's reference frame
    ball_in_p_vec = ball_vec - paddle_vec
    
    # Calculate trajectory angle and speed in paddle frame
    # Fixed to match notebook implementation exactly
    # Original: ball_traj_angle = 90.0 - closed_paddle - rad2deg(np.arctan2(ball_in_p_vec[1,0], ball_in_p_vec[0,0]))
    ball_traj_angle = 90.0 - closed_paddle - rad2deg(np.arctan(-ball_in_p_vec[1,0]/ball_in_p_vec[0,0]))
    
    # Also fixing speed calculation to match the notebook
    # Original: ball_traj_speed = np.sqrt(ball_in_p_vec[0,0]**2 + ball_in_p_vec[1,0]**2)
    ball_traj_speed = np.sqrt(ball_in_p_vec[0,0]**2 + ball_in_p_vec[1,0]**2)  # This is actually equivalent
    
    # Calculate visualization data for first plot
    t = np.linspace(-0.25, 0, 101)
    x_p = -t[0] * v_ball * np.cos(deg2rad(angle_ball)) - 0.6
    y_p = 0.5 * 9.8 * t[0]**2.0 - v_ball * np.sin(deg2rad(angle_ball)) * t[0]
    
    x_ball_after = (v_ball * np.cos(deg2rad(angle_ball)) * t + x_p).tolist()
    y_ball_after = (v_ball * np.sin(deg2rad(angle_ball)) * t - 0.5 * 9.8 * t**2.0 + y_p).tolist()
    
    x_paddle = [x_p, x_p + 1]
    y_star = y_p - np.tan(deg2rad(angle_paddle))
    y_paddle = [(y_star - y_p) * (x - x_p) + y_p for x in x_paddle]
    
    x_bat = [
        x_p - 0.15 / 2 * np.sin(deg2rad(closed_paddle)),
        x_p + 0.15 / 2 * np.sin(deg2rad(closed_paddle))
    ]
    y_bat = [
        y_p + 0.15 / 2 * np.cos(deg2rad(closed_paddle)),
        y_p - 0.15 / 2 * np.cos(deg2rad(closed_paddle))
    ]
    
    # Calculate visualization data for second plot (paddle frame)
    paddle_x = [
        -0.15 / 2.0 * np.sin(deg2rad(ball_traj_angle)),
        0.15 / 2.0 * np.sin(deg2rad(ball_traj_angle))
    ]
    paddle_y = [
        0.75 - 0.15 / 2.0 * np.cos(deg2rad(ball_traj_angle)),
        0.75 + 0.15 / 2.0 * np.cos(deg2rad(ball_traj_angle))
    ]
    
    # Generate angle arc
    theta = np.linspace(0, ball_traj_angle, 101)
    theta_x = (-0.15 / 4.0 * np.sin(deg2rad(theta))).tolist()
    theta_y = (0.75 - 0.15 / 4.0 * np.cos(deg2rad(theta))).tolist()
    
    return jsonify({
        'ball_traj_angle': ball_traj_angle,
        'ball_traj_speed': ball_traj_speed,
        'visualization': {
            'world_frame': {
                'x_ball_after': x_ball_after,
                'y_ball_after': y_ball_after,
                'x_paddle': x_paddle,
                'y_paddle': y_paddle,
                'x_bat': x_bat,
                'y_bat': y_bat,
                'x_p': x_p,
                'y_p': y_p
            },
            'paddle_frame': {
                'paddle_x': paddle_x,
                'paddle_y': paddle_y,
                'theta_x': theta_x,
                'theta_y': theta_y
            }
        }
    })

@app.route('/calculate_world_frame', methods=['POST'])
def calculate_world_frame():
    """Calculate shot outcome in world reference frame."""
    data = request.json
    
    # Extract input parameters
    v_ball = float(data['v_ball'])
    angle_ball = float(data['angle_ball'])
    v_paddle = float(data['v_paddle'])
    angle_paddle = float(data['angle_paddle'])
    closed_paddle = float(data['closed_paddle'])
    v_ball_after = float(data['v_ball_after'])
    angle_ball_after = float(data['angle_ball_after'])
    
    # In the world's reference frame
    ball_vec = np.array([
        [v_ball * np.cos(deg2rad(angle_ball))],
        [v_ball * np.sin(deg2rad(angle_ball))]
    ])
    
    paddle_vec = np.array([
        [-v_paddle * np.cos(deg2rad(angle_paddle))],
        [v_paddle * np.sin(deg2rad(angle_paddle))]
    ])
    
    # Ball velocity in paddle frame
    v_ball_after_in_p = np.array([
        [-v_ball_after * np.cos(deg2rad(angle_ball_after))],
        [v_ball_after * np.sin(deg2rad(angle_ball_after))]
    ])
    
    # Rotation matrix for closed paddle
    closed_paddle_rot_mat = np.array([
        [np.cos(deg2rad(closed_paddle)), -np.sin(deg2rad(closed_paddle))],
        [np.sin(deg2rad(closed_paddle)), np.cos(deg2rad(closed_paddle))]
    ])
    
    # Ball velocity in rotated paddle frame
    v_ball_after_in_rot_p = closed_paddle_rot_mat @ v_ball_after_in_p
    
    # Ball velocity in world frame
    v_ball_after_in_w = v_ball_after_in_rot_p + paddle_vec
    
    # Calculate final speed and angle in world frame
    speed_ball_after_in_w = np.sqrt(v_ball_after_in_w[0,0]**2 + v_ball_after_in_w[1,0]**2)
    angle_ball_after_in_w = rad2deg(np.arctan2(v_ball_after_in_w[1,0], -v_ball_after_in_w[0,0]))
    
    # For visualization, calculate the trajectory
    t = np.linspace(-0.25, 0, 101)
    x_p = -t[0] * v_ball * np.cos(deg2rad(angle_ball)) - 0.6
    y_p = 0.5 * 9.8 * t[0]**2.0 - v_ball * np.sin(deg2rad(angle_ball)) * t[0]
    
    x_ball_after_initial = (v_ball * np.cos(deg2rad(angle_ball)) * t + x_p).tolist()
    y_ball_after_initial = (v_ball * np.sin(deg2rad(angle_ball)) * t - 0.5 * 9.8 * t**2.0 + y_p).tolist()
    
    x_paddle = [x_p, x_p + 1]
    y_star = y_p - np.tan(deg2rad(angle_paddle))
    y_paddle = [(y_star - y_p) * (x - x_p) + y_p for x in x_paddle]
    
    x_bat = [
        x_p - 0.15 / 2 * np.sin(deg2rad(closed_paddle)),
        x_p + 0.15 / 2 * np.sin(deg2rad(closed_paddle))
    ]
    y_bat = [
        y_p + 0.15 / 2 * np.cos(deg2rad(closed_paddle)),
        y_p - 0.15 / 2 * np.cos(deg2rad(closed_paddle))
    ]
    
    # Calculate ball path after hitting the paddle
    t_f = np.linspace(0.0, 0.25, 101)
    x_f = (x_p + v_ball_after_in_w[0,0] * t_f).tolist()
    y_f = (y_p + v_ball_after_in_w[1,0] * t_f - 9.8 / 2.0 * t_f**2.0).tolist()
    
    # For paddle frame visualization (for reference)
    ball_before_x = [0.0, 0.0]
    ball_before_y = [0.3, 0.75]
    
    ball_traj_angle = 90.0 - closed_paddle - rad2deg(np.arctan2(ball_vec[1,0] - paddle_vec[1,0], 
                                                         ball_vec[0,0] - paddle_vec[0,0]))
    
    paddle_x = [
        -0.15 / 2.0 * np.sin(deg2rad(ball_traj_angle)),
        0.15 / 2.0 * np.sin(deg2rad(ball_traj_angle))
    ]
    paddle_y = [
        0.75 - 0.15 / 2.0 * np.cos(deg2rad(ball_traj_angle)),
        0.75 + 0.15 / 2.0 * np.cos(deg2rad(ball_traj_angle))
    ]
    
    ball_after_x = [0.0, -0.3 * np.sin(deg2rad(angle_ball_after))]
    ball_after_y = [0.75, 0.75 - 0.3 * np.cos(deg2rad(angle_ball_after))]
    
    # Generate angle arc for visualization
    beta = np.linspace(0, angle_ball_after, 101)
    beta_x = (-0.3 / 2.0 * np.sin(deg2rad(beta))).tolist()
    beta_y = (0.75 - 0.3 / 2.0 * np.cos(deg2rad(beta))).tolist()
    
    return jsonify({
        'speed_ball_after_in_w': float(speed_ball_after_in_w),
        'angle_ball_after_in_w': float(angle_ball_after_in_w),
        'visualization': {
            'world_frame': {
                'x_ball_after': x_ball_after_initial,
                'y_ball_after': y_ball_after_initial,
                'x_paddle': x_paddle,
                'y_paddle': y_paddle,
                'x_bat': x_bat,
                'y_bat': y_bat,
                'x_p': x_p,
                'y_p': y_p,
                'x_f': x_f,
                'y_f': y_f
            },
            'paddle_frame': {
                'ball_before_x': ball_before_x,
                'ball_before_y': ball_before_y,
                'paddle_x': paddle_x,
                'paddle_y': paddle_y,
                'ball_after_x': ball_after_x,
                'ball_after_y': ball_after_y,
                'beta_x': beta_x,
                'beta_y': beta_y
            }
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5018)
