import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./index.css";

type Priority = "low" | "medium" | "high";

type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

type Todo = {
  id: string;
  title: string;
  done: boolean;
  project: string;
  priority: Priority;
  milestone: string;
  assignee: string;
  startDate: string;
  endDate: string;
  subtasks: Subtask[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyDraft = {
  title: "",
  project: "",
  priority: "medium" as Priority,
  milestone: "",
  assignee: "",
  startDate: "",
  endDate: "",
};

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const addTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setTodos((t) => [...t, { id: uid(), done: false, subtasks: [], ...draft }]);
    setDraft(emptyDraft);
  };

  const toggleTodo = (id: string) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const deleteTodo = (id: string) => setTodos((t) => t.filter((x) => x.id !== id));

  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addSubtask = (todoId: string, title: string) => {
    if (!title.trim()) return;
    setTodos((t) =>
      t.map((x) =>
        x.id === todoId ? { ...x, subtasks: [...x.subtasks, { id: uid(), title, done: false }] } : x,
      ),
    );
  };

  const toggleSubtask = (todoId: string, subId: string) =>
    setTodos((t) =>
      t.map((x) =>
        x.id === todoId
          ? { ...x, subtasks: x.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
          : x,
      ),
    );

  const deleteSubtask = (todoId: string, subId: string) =>
    setTodos((t) =>
      t.map((x) =>
        x.id === todoId ? { ...x, subtasks: x.subtasks.filter((s) => s.id !== subId) } : x,
      ),
    );

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Simple Todo</h1>

      <form onSubmit={addTodo} className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input
          className="col-span-2 sm:col-span-4"
          placeholder="Task title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <Input
          placeholder="Project"
          value={draft.project}
          onChange={(e) => setDraft({ ...draft, project: e.target.value })}
        />
        <Input
          placeholder="Milestone"
          value={draft.milestone}
          onChange={(e) => setDraft({ ...draft, milestone: e.target.value })}
        />
        <Input
          placeholder="Assignee"
          value={draft.assignee}
          onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
        />
        <Select
          value={draft.priority}
          onValueChange={(v: Priority) => setDraft({ ...draft, priority: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={draft.startDate}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
        />
        <Input
          type="date"
          value={draft.endDate}
          onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
        />
        <Button type="submit" className="col-span-2 sm:col-span-2">
          Add task
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {todos.length === 0 && (
          <li className="text-sm text-muted-foreground">No tasks yet.</li>
        )}
        {todos.map((todo) => (
          <li key={todo.id} className="rounded border p-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                className="mt-1.5"
              />
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(todo.id)}
                  className={`text-left font-medium ${todo.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {todo.title}
                </button>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {todo.project && <span>proj: {todo.project}</span>}
                  {todo.milestone && <span>milestone: {todo.milestone}</span>}
                  {todo.assignee && <span>@{todo.assignee}</span>}
                  <span>priority: {todo.priority}</span>
                  {todo.startDate && <span>start: {todo.startDate}</span>}
                  {todo.endDate && <span>end: {todo.endDate}</span>}
                  {todo.subtasks.length > 0 && (
                    <span>
                      subtasks: {todo.subtasks.filter((s) => s.done).length}/{todo.subtasks.length}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)}>
                Delete
              </Button>
            </div>

            {expanded.has(todo.id) && (
              <SubtaskSection
                todo={todo}
                onAdd={(t) => addSubtask(todo.id, t)}
                onToggle={(sid) => toggleSubtask(todo.id, sid)}
                onDelete={(sid) => deleteSubtask(todo.id, sid)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubtaskSection({
  todo,
  onAdd,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAdd(title);
    setTitle("");
  };

  return (
    <div className="mt-3 ml-7 border-l pl-4">
      <ul className="flex flex-col gap-1">
        {todo.subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.done} onChange={() => onToggle(s.id)} />
            <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.title}</span>
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              remove
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <Input
          placeholder="Add subtask"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8"
        />
        <Button type="submit" size="sm" variant="secondary">
          Add
        </Button>
      </form>
    </div>
  );
}

export default App;
