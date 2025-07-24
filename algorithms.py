import networkx as nx
import matplotlib.pyplot as plt
from collections import deque
import heapq

class Graph:
    """Base class for graph representation and visualization."""
    def __init__(self, num_nodes):
        if num_nodes <= 0:
            raise ValueError("Number of nodes must be positive")
        self.num_nodes = num_nodes
        self.graph = [[] for _ in range(num_nodes)]
        self.edges = []

    def add_edge(self, u, v, weight=1):
        """Add an undirected edge to the graph."""
        if not (0 <= u < self.num_nodes and 0 <= v < self.num_nodes):
            raise ValueError(f"Nodes must be between 0 and {self.num_nodes - 1}")
        if weight < 0:
            raise ValueError("Edge weight cannot be negative")
        self.graph[u].append((v, weight))
        self.graph[v].append((u, weight))  # Undirected graph
        self.edges.append((u, v, weight))

    def visualize_path(self, path, title="Graph Path"):
        """Visualize the graph with the given path highlighted."""
        G = nx.Graph()
        for u, v, w in self.edges:
            G.add_edge(u, v, weight=w)

        pos = nx.spring_layout(G, seed=42)
        plt.figure(figsize=(8, 6))
        nx.draw(G, pos, with_labels=True, node_color='lightblue', node_size=800, font_size=12, font_weight='bold')
        labels = nx.get_edge_attributes(G, 'weight')
        nx.draw_networkx_edge_labels(G, pos, edge_labels=labels, font_color='black')

        if path:
            path_edges = [(path[i], path[i + 1]) for i in range(len(path) - 1)]
            nx.draw_networkx_edges(G, pos, edgelist=path_edges, edge_color='red', width=3)
        plt.title(title, fontsize=14)
        plt.show()

class BFS(Graph):
    """Breadth-First Search implementation."""
    def bfs(self, start):
        if not (0 <= start < self.num_nodes):
            raise ValueError(f"Start node must be between 0 and {self.num_nodes - 1}")
        visited = [False] * self.num_nodes
        queue = deque([start])
        visited[start] = True
        path = []
        step = 0
        print(f"\nBước 1: Đặt đỉnh bắt đầu {start} vào hàng đợi và đánh dấu đã thăm.")
        while queue:
            current = queue.popleft()
            path.append(current)
            step += 1
            print(f"\nBước {step+1}: Lấy đỉnh {current} ra khỏi hàng đợi, duyệt các đỉnh kề:")
            for neighbor, _ in self.graph[current]:
                if not visited[neighbor]:
                    visited[neighbor] = True
                    queue.append(neighbor)
                    print(f"  → Thêm đỉnh {neighbor} vào hàng đợi và đánh dấu đã thăm.")
        print(f"\nKết thúc BFS. Số bước duyệt: {len(path)}")
        print(f"Số đỉnh đã duyệt: {len(path)}")
        print(f"Thứ tự duyệt: {path}\n")
        return path

class DFS(Graph):
    """Depth-First Search implementation."""
    def dfs(self, start):
        if not (0 <= start < self.num_nodes):
            raise ValueError(f"Start node must be between 0 and {self.num_nodes - 1}")
        visited = [False] * self.num_nodes
        path = []
        step = 0
        def dfs_visit(u):
            nonlocal step
            visited[u] = True
            path.append(u)
            step += 1
            print(f"\nBước {step}: Đến đỉnh {u}, duyệt các đỉnh kề:")
            for v, _ in self.graph[u]:
                if not visited[v]:
                    print(f"  → Đi sâu đến đỉnh {v} từ đỉnh {u}.")
                    dfs_visit(v)
        print(f"\nBắt đầu DFS từ đỉnh {start}.")
        dfs_visit(start)
        print(f"\nKết thúc DFS. Số bước duyệt: {len(path)}")
        print(f"Số đỉnh đã duyệt: {len(path)}")
        print(f"Thứ tự duyệt: {path}\n")
        return path

class Dijkstra(Graph):
    """Dijkstra's algorithm implementation for shortest paths."""
    def dijkstra(self, start):
        if not (0 <= start < self.num_nodes):
            raise ValueError(f"Start node must be between 0 and {self.num_nodes - 1}")
        dist = [float('inf')] * self.num_nodes
        dist[start] = 0
        prev = [-1] * self.num_nodes
        heap = [(0, start)]
        visited_count = 0
        update_count = 0
        print(f"\nKhởi tạo khoảng cách từ đỉnh {start} đến các đỉnh khác là vô cùng, riêng {start} là 0.")
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            visited_count += 1
            print(f"\nXét đỉnh {u} với khoảng cách hiện tại {d}.")
            for v, w in self.graph[u]:
                if dist[v] > dist[u] + w:
                    dist[v] = dist[u] + w
                    prev[v] = u
                    heapq.heappush(heap, (dist[v], v))
                    update_count += 1
                    print(f"  → Cập nhật khoảng cách đến đỉnh {v}: {dist[v]} (qua {u})")
        print(f"\nKết thúc Dijkstra. Số đỉnh đã xét: {visited_count}")
        print(f"Số lần cập nhật khoảng cách: {update_count}\n")
        return dist, prev

    def reconstruct_path(self, prev, target):
        """Reconstruct the shortest path from start to target."""
        if not (0 <= target < self.num_nodes):
            raise ValueError(f"Target node must be between 0 and {self.num_nodes - 1}")
        path = []
        while target != -1:
            path.append(target)
            target = prev[target]
        path = path[::-1]
        return path if path[0] == prev[path[0]] else []

class BellmanFord(Graph):
    """Bellman-Ford algorithm implementation for shortest paths."""
    def bellman_ford(self, start):
        if not (0 <= start < self.num_nodes):
            raise ValueError(f"Start node must be between 0 and {self.num_nodes - 1}")
        dist = [float('inf')] * self.num_nodes
        dist[start] = 0
        prev = [-1] * self.num_nodes
        update_count = 0
        print(f"\nKhởi tạo khoảng cách từ đỉnh {start} đến các đỉnh khác là vô cùng, riêng {start} là 0.")
        for i in range(self.num_nodes - 1):
            print(f"\nLặp lần thứ {i+1}:")
            for u, v, w in self.edges:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    prev[v] = u
                    update_count += 1
                    print(f"  → Cập nhật khoảng cách: {u} → {v} = {dist[v]}")
                if dist[v] + w < dist[u]:
                    dist[u] = dist[v] + w
                    prev[u] = v
                    update_count += 1
                    print(f"  → Cập nhật khoảng cách: {v} → {u} = {dist[u]}")
        # Check for negative cycles
        for u, v, w in self.edges:
            if dist[u] + w < dist[v]:
                print("\nĐồ thị có chu trình âm!")
                return None, None
        print(f"\nKết thúc Bellman-Ford. Số lần cập nhật khoảng cách: {update_count}\n")
        return dist, prev

    def reconstruct_path(self, prev, target):
        """Reconstruct the shortest path from start to target."""
        if not (0 <= target < self.num_nodes):
            raise ValueError(f"Target node must be between 0 and {self.num_nodes - 1}")
        path = []
        while target != -1:
            path.append(target)
            target = prev[target]
        path = path[::-1]
        return path if path[0] == prev[path[0]] else []

class AStar(Graph):
    """A* algorithm implementation for shortest path with heuristic."""
    def __init__(self, num_nodes, heuristic):
        super().__init__(num_nodes)
        if len(heuristic) != num_nodes:
            raise ValueError(f"Heuristic list must have {num_nodes} values")
        self.heuristic = heuristic
    def a_star(self, start, goal):
        if not (0 <= start < self.num_nodes and 0 <= goal < self.num_nodes):
            raise ValueError(f"Start and goal nodes must be between 0 and {self.num_nodes - 1}")
        open_set = [(self.heuristic[start], 0, start, -1)]  # (f, g, node, parent)
        visited = {}
        step = 0
        print(f"\nKhởi tạo: Đưa đỉnh bắt đầu {start} vào hàng đợi ưu tiên với heuristic = {self.heuristic[start]}.")
        while open_set:
            f, g, current, parent = heapq.heappop(open_set)
            if current in visited:
                continue
            visited[current] = parent
            step += 1
            print(f"\nBước {step}: Lấy đỉnh {current} ra khỏi hàng đợi (f = {f}, g = {g}).")
            if current == goal:
                print(f"  → Đã đến đỉnh đích {goal}.")
                break
            for neighbor, weight in self.graph[current]:
                if neighbor not in visited:
                    new_g = g + weight
                    new_f = new_g + self.heuristic[neighbor]
                    heapq.heappush(open_set, (new_f, new_g, neighbor, current))
                    print(f"  → Thêm đỉnh {neighbor} vào hàng đợi với f = {new_f} (g = {new_g}, heuristic = {self.heuristic[neighbor]}).")
        # Truy vết đường đi
        path = []
        node = goal
        while node != -1:
            path.append(node)
            node = visited.get(node, -1)
        path = path[::-1]
        print(f"\nKết thúc A*. Số bước mở rộng đỉnh: {step}")
        return path if path[0] == start else []

def create_graph(num_nodes, edges):
    """Create a graph instance based on the algorithm choice."""
    graph = Graph(num_nodes)
    for u, v, w in edges:
        graph.add_edge(u, v, w)
    return graph

def input_int(prompt, min_value=None, max_value=None):
    while True:
        try:
            value = int(input(prompt))
            if min_value is not None and value < min_value:
                print(f"Value must be >= {min_value}.")
                continue
            if max_value is not None and value > max_value:
                print(f"Value must be <= {max_value}.")
                continue
            return value
        except ValueError:
            print("Invalid input. Please enter an integer.")

def input_edges(num_edges, num_nodes, allow_negative_weights=True):
    edges = []
    for i in range(num_edges):
        while True:
            try:
                s = input(f"Edge {i+1} (format: u v weight): ").split()
                if len(s) != 3:
                    print("Please enter exactly 3 values: u v weight.")
                    continue
                u, v, w = map(int, s)
                if not (0 <= u < num_nodes and 0 <= v < num_nodes):
                    print(f"Nodes must be between 0 and {num_nodes - 1}.")
                    continue
                if not allow_negative_weights and w < 0:
                    print("Negative weights are not allowed for this algorithm.")
                    continue
                edges.append((u, v, w))
                break
            except ValueError:
                print("Invalid input. Please enter integers for u, v, and weight.")
    return edges

def input_heuristic(num_nodes):
    while True:
        try:
            s = input(f"Enter heuristic values for {num_nodes} nodes (space-separated): ").split()
            if len(s) != num_nodes:
                print(f"Expected {num_nodes} heuristic values.")
                continue
            heuristic = list(map(int, s))
            if any(h < 0 for h in heuristic):
                print("Heuristic values cannot be negative.")
                continue
            return heuristic
        except ValueError:
            print("Invalid input. Please enter integers only.")

def run():
    while True:
        try:
            print("\nAvailable algorithms:")
            print("1. BFS - Breadth-First Search (đầu vào: số đỉnh, cạnh, đỉnh bắt đầu)")
            print("2. DFS - Depth-First Search (đầu vào: số đỉnh, cạnh, đỉnh bắt đầu)")
            print("3. Dijkstra (đầu vào: số đỉnh, cạnh có trọng số >= 0, đỉnh bắt đầu, đỉnh kết thúc)")
            print("4. Bellman-Ford (đầu vào: số đỉnh, cạnh có trọng số bất kỳ, đỉnh bắt đầu, đỉnh kết thúc)")
            print("5. A* (đầu vào: số đỉnh, cạnh có trọng số >= 0, heuristic, đỉnh bắt đầu, đỉnh kết thúc)")
            print("\nLưu ý: Các đỉnh được đánh số từ 0 đến n-1.")
            choice = input_int("Nhập lựa chọn thuật toán (1-5): ", 1, 5)

            print("\nNhập số đỉnh của đồ thị (n > 0):")
            num_nodes = input_int("Số đỉnh: ", 1)
            print("\nNhập số cạnh của đồ thị (>= 0):")
            num_edges = input_int("Số cạnh: ", 0)

            allow_negative_weights = (choice == 4)
            if choice in [3, 5]:
                print("Lưu ý: Không được nhập cạnh có trọng số âm cho Dijkstra hoặc A*.")
            print("\nNhập từng cạnh theo định dạng: u v weight")
            print("  - u, v là hai đỉnh (0 <= u, v < n)")
            print("  - weight là trọng số của cạnh (số nguyên)")
            print("Ví dụ: 0 1 5 (cạnh nối từ đỉnh 0 đến đỉnh 1, trọng số 5)")
            edges = input_edges(num_edges, num_nodes, allow_negative_weights=allow_negative_weights)

            # Hiển thị cấu trúc graph dạng dict
            graph_dict = {i: [] for i in range(num_nodes)}
            for u, v, w in edges:
                graph_dict[u].append((v, w))
                graph_dict[v].append((u, w))  # Đồ thị vô hướng
            print("\nCấu trúc đồ thị bạn vừa nhập:")
            print("graph = {")
            for k in graph_dict:
                print(f"    {k}: {graph_dict[k]},")
            print("}")

            if choice in [1, 2]:
                print("\nNhập đỉnh bắt đầu (0 <= start < n):")
                start = input_int("Đỉnh bắt đầu: ", 0, num_nodes - 1)
                if choice == 1:
                    print("\n--- Breadth-First Search ---")
                    bfs = BFS(num_nodes)
                    for u, v, w in edges:
                        bfs.add_edge(u, v)
                    path = bfs.bfs(start)
                    bfs.visualize_path(path, "BFS Path")
                else:
                    print("\n--- Depth-First Search ---")
                    dfs = DFS(num_nodes)
                    for u, v, w in edges:
                        dfs.add_edge(u, v)
                    path = dfs.dfs(start)
                    dfs.visualize_path(path, "DFS Path")
            elif choice == 3:
                print("\n--- Dijkstra's Algorithm ---")
                print("Nhập đỉnh bắt đầu (0 <= start < n):")
                start = input_int("Đỉnh bắt đầu: ", 0, num_nodes - 1)
                print("Nhập đỉnh kết thúc (0 <= end < n):")
                end = input_int("Đỉnh kết thúc: ", 0, num_nodes - 1)
                dij = Dijkstra(num_nodes)
                for u, v, w in edges:
                    dij.add_edge(u, v, w)
                dist, prev = dij.dijkstra(start)
                path = dij.reconstruct_path(prev, end)
                if path:
                    print(f"Độ dài đường đi ngắn nhất từ {start} đến {end}: {dist[end]}")
                    print(f"Đường đi ngắn nhất: {path}\n")
                else:
                    print("Không tồn tại đường đi.\n")
                dij.visualize_path(path, "Dijkstra's Shortest Path")
            elif choice == 4:
                print("\n--- Bellman-Ford Algorithm ---")
                print("Nhập đỉnh bắt đầu (0 <= start < n):")
                start = input_int("Đỉnh bắt đầu: ", 0, num_nodes - 1)
                print("Nhập đỉnh kết thúc (0 <= end < n):")
                end = input_int("Đỉnh kết thúc: ", 0, num_nodes - 1)
                bell = BellmanFord(num_nodes)
                for u, v, w in edges:
                    bell.add_edge(u, v, w)
                dist, prev = bell.bellman_ford(start)
                if dist:
                    path = bell.reconstruct_path(prev, end)
                    if path:
                        print(f"Độ dài đường đi ngắn nhất từ {start} đến {end}: {dist[end]}")
                        print(f"Đường đi ngắn nhất: {path}\n")
                    else:
                        print("Không tồn tại đường đi.\n")
                    bell.visualize_path(path, "Bellman-Ford Shortest Path")
            elif choice == 5:
                print("\n--- A* Algorithm ---")
                print(f"Nhập heuristic cho từng đỉnh (cách nhau bởi dấu cách, {num_nodes} số nguyên không âm):")
                print(f"Ví dụ: 7 6 2 0 nếu có 4 đỉnh")
                heuristic = input_heuristic(num_nodes)
                print("Nhập đỉnh bắt đầu (0 <= start < n):")
                start = input_int("Đỉnh bắt đầu: ", 0, num_nodes - 1)
                print("Nhập đỉnh kết thúc (0 <= end < n):")
                end = input_int("Đỉnh kết thúc: ", 0, num_nodes - 1)
                astar = AStar(num_nodes, heuristic)
                for u, v, w in edges:
                    astar.add_edge(u, v, w)
                path = astar.a_star(start, end)
                if path:
                    print(f"Độ dài đường đi ngắn nhất từ {start} đến {end}: {len(path) - 1}")
                    print(f"Đường đi ngắn nhất: {path}\n")
                else:
                    print("Không tồn tại đường đi.\n")
                astar.visualize_path(path, "A* Shortest Path")
            again = input("\nBạn có muốn thử qua thuật toán khác không? (y/n): ").strip().lower()
            if again != 'y':
                print("Tạm biệt!")
                break
        except Exception as e:
            print("Lỗi:", e)
            print("Vui lòng thử lại!\n")

if __name__ == "__main__":
    run()