from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import traceback
import os

# --- Thuật toán giữ nguyên như trước ---
import networkx as nx
from collections import deque
import heapq

class Graph:
    def __init__(self, num_nodes):
        if num_nodes <= 0:
            raise ValueError("Number of nodes must be positive")
        self.num_nodes = num_nodes
        self.graph = [[] for _ in range(num_nodes)]
        self.edges = []
    def add_edge(self, u, v, weight=1):
        self.graph[u].append((v, weight))
        self.graph[v].append((u, weight))
        self.edges.append((u, v, weight))

class BFS(Graph):
    def bfs(self, start):
        visited = [False] * self.num_nodes
        queue = deque([start])
        visited[start] = True
        path = []
        steps = [f"Bước 1: Đặt đỉnh bắt đầu {start} vào hàng đợi và đánh dấu đã thăm."]
        step = 1
        while queue:
            current = queue.popleft()
            path.append(current)
            step += 1
            steps.append(f"\nBước {step}: Lấy đỉnh {current} ra khỏi hàng đợi, duyệt các đỉnh kề:")
            for neighbor, _ in self.graph[current]:
                if not visited[neighbor]:
                    visited[neighbor] = True
                    queue.append(neighbor)
                    steps.append(f"  → Thêm đỉnh {neighbor} vào hàng đợi và đánh dấu đã thăm.")
        steps.append(f"\nKết thúc BFS. Số bước duyệt: {len(path)}")
        steps.append(f"Số đỉnh đã duyệt: {len(path)}")
        steps.append(f"Thứ tự duyệt: {path}")
        return steps, path

class DFS(Graph):
    def dfs(self, start):
        visited = [False] * self.num_nodes
        path = []
        steps = []
        step = 0
        def dfs_visit(u):
            nonlocal step
            visited[u] = True
            path.append(u)
            step += 1
            steps.append(f"\nBước {step}: Đến đỉnh {u}, duyệt các đỉnh kề:")
            for v, _ in self.graph[u]:
                if not visited[v]:
                    steps.append(f"  → Đi sâu đến đỉnh {v} từ đỉnh {u}.")
                    dfs_visit(v)
        steps.append(f"\nBắt đầu DFS từ đỉnh {start}.")
        dfs_visit(start)
        steps.append(f"\nKết thúc DFS. Số bước duyệt: {len(path)}")
        steps.append(f"Số đỉnh đã duyệt: {len(path)}")
        steps.append(f"Thứ tự duyệt: {path}")
        return steps, path

class Dijkstra(Graph):
    def dijkstra(self, start):
        dist = [float('inf')] * self.num_nodes
        dist[start] = 0
        prev = [-1] * self.num_nodes
        heap = [(0, start)]
        visited_count = 0
        update_count = 0
        steps = [f"Khởi tạo khoảng cách từ đỉnh {start} đến các đỉnh khác là vô cùng, riêng {start} là 0."]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            visited_count += 1
            steps.append(f"\nXét đỉnh {u} với khoảng cách hiện tại {d}.")
            for v, w in self.graph[u]:
                if dist[v] > dist[u] + w:
                    dist[v] = dist[u] + w
                    prev[v] = u
                    heapq.heappush(heap, (dist[v], v))
                    update_count += 1
                    steps.append(f"  → Cập nhật khoảng cách đến đỉnh {v}: {dist[v]} (qua {u})")
        steps.append(f"\nKết thúc Dijkstra. Số đỉnh đã xét: {visited_count}")
        steps.append(f"Số lần cập nhật khoảng cách: {update_count}")
        return steps, dist, prev
    def reconstruct_path(self, prev, target):
        path = []
        while target != -1:
            path.append(target)
            target = prev[target]
        path = path[::-1]
        return path if path and prev[path[0]] == path[0] or prev[path[0]] == -1 else []

class BellmanFord(Graph):
    def bellman_ford(self, start):
        dist = [float('inf')] * self.num_nodes
        dist[start] = 0
        prev = [-1] * self.num_nodes
        update_count = 0
        steps = [f"Khởi tạo khoảng cách từ đỉnh {start} đến các đỉnh khác là vô cùng, riêng {start} là 0."]
        for i in range(self.num_nodes - 1):
            steps.append(f"\nLặp lần thứ {i+1}:")
            for u, v, w in self.edges:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    prev[v] = u
                    update_count += 1
                    steps.append(f"  → Cập nhật khoảng cách: {u} → {v} = {dist[v]}")
                if dist[v] + w < dist[u]:
                    dist[u] = dist[v] + w
                    prev[u] = v
                    update_count += 1
                    steps.append(f"  → Cập nhật khoảng cách: {v} → {u} = {dist[u]}")
        for u, v, w in self.edges:
            if dist[u] + w < dist[v]:
                steps.append("Đồ thị có chu trình âm!")
                return steps, None, None
        steps.append(f"\nKết thúc Bellman-Ford. Số lần cập nhật khoảng cách: {update_count}")
        return steps, dist, prev
    def reconstruct_path(self, prev, target):
        path = []
        while target != -1:
            path.append(target)
            target = prev[target]
        path = path[::-1]
        return path if path and prev[path[0]] == path[0] or prev[path[0]] == -1 else []

class AStar(Graph):
    def __init__(self, num_nodes, heuristic):
        super().__init__(num_nodes)
        self.heuristic = heuristic
    def a_star(self, start, goal):
        open_set = [(self.heuristic[start], 0, start, -1)]
        visited = {}
        step = 0
        steps = [f"Khởi tạo: Đưa đỉnh bắt đầu {start} vào hàng đợi ưu tiên với heuristic = {self.heuristic[start]}."]
        while open_set:
            open_set.sort()
            f, g, current, parent = open_set.pop(0)
            if current in visited:
                continue
            visited[current] = parent
            step += 1
            steps.append(f"\nBước {step}: Lấy đỉnh {current} ra khỏi hàng đợi (f = {f}, g = {g}).")
            if current == goal:
                steps.append(f"  → Đã đến đỉnh đích {goal}.")
                break
            for neighbor, weight in self.graph[current]:
                if neighbor not in visited:
                    new_g = g + weight
                    new_f = new_g + self.heuristic[neighbor]
                    open_set.append((new_f, new_g, neighbor, current))
                    steps.append(f"  → Thêm đỉnh {neighbor} vào hàng đợi với f = {new_f} (g = {new_g}, heuristic = {self.heuristic[neighbor]}).")
        path = []
        node = goal
        while node != -1:
            path.append(node)
            node = visited.get(node, -1)
        path = path[::-1]
        steps.append(f"\nKết thúc A*. Số bước mở rộng đỉnh: {step}")
        return steps, path if path and path[0] == start else []

# --- Flask App ---
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run-algorithm', methods=['POST'])
def run_algorithm():
    try:
        data = request.json
        algo = data.get('algorithm')
        num_nodes = int(data.get('num_nodes'))
        edges = data.get('edges')  # List of [u, v, w]
        start = data.get('start')
        end = data.get('end')
        heuristic = data.get('heuristic', [])
        if algo == 'bfs':
            bfs = BFS(num_nodes)
            for u, v, w in edges:
                bfs.add_edge(u, v)
            steps, path = bfs.bfs(start)
            return jsonify({'steps': steps, 'path': path})
        elif algo == 'dfs':
            dfs = DFS(num_nodes)
            for u, v, w in edges:
                dfs.add_edge(u, v)
            steps, path = dfs.dfs(start)
            return jsonify({'steps': steps, 'path': path})
        elif algo == 'dijkstra':
            dij = Dijkstra(num_nodes)
            for u, v, w in edges:
                dij.add_edge(u, v, w)
            steps, dist, prev = dij.dijkstra(start)
            path = []
            if prev:
                node = end
                while node != -1:
                    path.append(node)
                    node = prev[node]
                path = path[::-1]
                if not (path and path[0] == start):
                    path = []
            return jsonify({'steps': steps, 'dist': dist, 'path': path})
        elif algo == 'bellmanford':
            bell = BellmanFord(num_nodes)
            for u, v, w in edges:
                bell.add_edge(u, v, w)
            steps, dist, prev = bell.bellman_ford(start)
            path = []
            if dist and prev:
                node = end
                while node != -1:
                    path.append(node)
                    node = prev[node]
                path = path[::-1]
                if not (path and path[0] == start):
                    path = []
            return jsonify({'steps': steps, 'dist': dist, 'path': path})
        elif algo == 'astar':
            astar = AStar(num_nodes, heuristic)
            for u, v, w in edges:
                astar.add_edge(u, v, w)
            steps, path = astar.a_star(start, end)
            return jsonify({'steps': steps, 'path': path})
        else:
            return jsonify({'error': 'Thuật toán không hợp lệ!'}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(debug=True) 