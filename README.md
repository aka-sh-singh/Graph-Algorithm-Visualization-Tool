# Graph Algorithm Visualization Tool

**Graph Path Finder** is an interactive web application that visualizes popular shortest path algorithms such as **Dijkstra’s Algorithm** and **Breadth-First Search (BFS)** in real time.  
It’s designed for students, developers, and enthusiasts to understand how graph traversal and shortest path algorithms work step-by-step.

---

## Features

-  **Interactive Graph Editor** — Add, connect, or remove nodes and edges with ease.  
-  **Set Start and End Points** — Define custom source and destination nodes.  
-  **Real-time Visualization** — Watch how Dijkstra’s and BFS algorithms explore paths step-by-step.  
-  **Algorithm Comparison** — Understand differences in behavior and path discovery.  
-  **Modern UI/UX** — Built with **Tailwind CSS** and **shadcn/ui** for a clean, minimal interface.  
-  **Fast & Responsive** — Powered by **React + Vite** for instant feedback and performance.

---

##  Algorithms Implemented

| Algorithm | Type | Description |
|------------|------|-------------|
| **Dijkstra’s Algorithm** | Weighted | Finds the shortest path from a source to all other nodes. |
| **Breadth-First Search (BFS)** | Unweighted | Explores all neighbors layer by layer, useful for unweighted graphs. |

>  *Future updates will include A* Search and Depth-First Search (DFS).*

---

##  Tech Stack

- **Frontend:** React (with Vite)
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** JavaScript / TypeScript
- **Visualization Logic:** Custom graph traversal and animation logic

---

## Installation & Setup

Follow these steps to run the project locally:

```bash
# 1️ Clone the repository
git clone https://github.com/aka-sh-singh/Graph-Algorithm-Visualization-Tool.git

# 2️ Navigate into the project folder
cd Graph-Algorithm-Visualization-Tool

# 3️ Install dependencies
npm install

# 4️ Start the development server
npm run dev
```

Then open your browser and go to:
```
http://localhost:5173/
```

---



---



##  How It Works

1. The user creates a custom graph by adding nodes and edges.  
2. Once the start and end points are selected, the chosen algorithm (Dijkstra or BFS) begins traversal.  
3. The app visually updates the graph to show visited nodes, shortest path, and final result.  
4. Visualization is animated step-by-step for learning clarity.

---

##  Contributing

Contributions are welcome!  
If you’d like to improve algorithms, add new features, or enhance the UI:

1. Fork this repository  
2. Create a new branch:  
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push  
4. Submit a pull request   

---

##  License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

##  Acknowledgments

- [React](https://reactjs.org/)  
- [Vite](https://vitejs.dev/)  
- [Tailwind CSS](https://tailwindcss.com/)  
- [shadcn/ui](https://ui.shadcn.com/)  
