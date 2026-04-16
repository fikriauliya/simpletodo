import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  endDate: string;
  subtasks: Subtask[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};

const nextWeekday = (target: number) => {
  const d = new Date();
  const diff = ((target - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return toISO(d);
};

const duePresets = () => {
  const all = [
    { label: "Today", value: toISO(new Date()) },
    { label: "Tomorrow", value: addDays(1) },
    { label: "This Friday", value: nextWeekday(5) },
    { label: "Next week", value: addDays(7) },
  ];
  const seen = new Set<string>();
  return all.filter((p) => (seen.has(p.value) ? false : (seen.add(p.value), true)));
};

const priorityMeta = {
  low: {
    label: "Low",
    Icon: ArrowDown,
    selected: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:text-white",
    unselected: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700",
    badge: "text-emerald-600",
  },
  medium: {
    label: "Medium",
    Icon: Minus,
    selected: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white",
    unselected: "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700",
    badge: "text-amber-600",
  },
  high: {
    label: "High",
    Icon: ArrowUp,
    selected: "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white",
    unselected: "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700",
    badge: "text-red-600",
  },
} as const;

const emptyDraft = {
  title: "",
  project: "",
  priority: "medium" as Priority,
  milestone: "",
  assignee: "",
  endDate: "",
};

const AVATAR_PALETTE = [
  "bg-sky-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

const colorForName = (name: string) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

const SEED_ASSIGNEES = ["Sarah", "Alex", "Jordan", "Priya", "Maya", "Leo"];

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [reached, setReached] = useState(0);
  const [customDueOpen, setCustomDueOpen] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const knownMilestones = Array.from(new Set(todos.map((t) => t.milestone).filter(Boolean)));

  const advance = (i: number) => setReached((r) => Math.max(r, i + 1));

  const addTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setTodos((t) => [...t, { id: uid(), done: false, subtasks: [], ...draft }]);
    setDraft(emptyDraft);
    setReached(0);
    setCustomDueOpen(false);
    setAddingMilestone(false);
    setNewMilestone("");
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

      <form onSubmit={addTodo} className="mb-6 flex flex-col gap-3">
        <Field label="Task" htmlFor="f-title">
          <Input
            id="f-title"
            placeholder="What needs to be done?"
            value={draft.title}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value });
              if (e.target.value) advance(0);
            }}
            onBlur={() => draft.title && advance(0)}
            autoFocus
          />
        </Field>

        {reached >= 1 && (
          <Field label="Due date" htmlFor="f-end">
            <div className="flex flex-wrap items-center gap-2">
              {duePresets().map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  size="sm"
                  variant={draft.endDate === p.value && !customDueOpen ? "default" : "outline"}
                  onClick={() => {
                    setDraft({ ...draft, endDate: p.value });
                    setCustomDueOpen(false);
                    advance(1);
                  }}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={customDueOpen ? "default" : "outline"}
                onClick={() => setCustomDueOpen((v) => !v)}
              >
                Custom…
              </Button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, endDate: "" });
                  setCustomDueOpen(false);
                  advance(1);
                }}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                No date
              </button>
            </div>
            {customDueOpen && (
              <Input
                id="f-end"
                type="date"
                value={draft.endDate}
                onChange={(e) => {
                  setDraft({ ...draft, endDate: e.target.value });
                  advance(1);
                }}
                className="mt-2 w-fit"
              />
            )}
          </Field>
        )}

        {reached >= 2 && (
          <Field label="Priority" htmlFor="f-priority">
            <div className="flex flex-wrap gap-2">
              {(["low", "medium", "high"] as const).map((p) => {
                const meta = priorityMeta[p];
                const selected = draft.priority === p;
                return (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant="outline"
                    className={selected ? meta.selected : meta.unselected}
                    onClick={() => {
                      setDraft({ ...draft, priority: p });
                      advance(2);
                    }}
                  >
                    <meta.Icon className="mr-1 h-4 w-4" />
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          </Field>
        )}

        {reached >= 3 && (
          <Field label="Assignee" htmlFor="f-assignee">
            <div className="flex flex-wrap items-center gap-2">
              {SEED_ASSIGNEES.map((name) => {
                const selected = draft.assignee === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setDraft({ ...draft, assignee: name });
                      advance(3);
                    }}
                    className={`rounded-full transition ${
                      selected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={name}
                    title={name}
                  >
                    <Avatar name={name} />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, assignee: "" });
                  advance(3);
                }}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                No one
              </button>
            </div>
          </Field>
        )}

        {reached >= 4 && (
          <Field label="Project" htmlFor="f-project">
            <Input
              id="f-project"
              placeholder="Which project?"
              value={draft.project}
              onChange={(e) => {
                setDraft({ ...draft, project: e.target.value });
                if (e.target.value) advance(4);
              }}
              onBlur={() => advance(4)}
            />
          </Field>
        )}

        {reached >= 5 && (
          <Field label="Milestone" htmlFor="f-milestone">
            <div className="flex flex-wrap items-center gap-2">
              {knownMilestones.map((name) => {
                const selected = draft.milestone === name;
                return (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => {
                      setDraft({ ...draft, milestone: name });
                      setAddingMilestone(false);
                    }}
                  >
                    {name}
                  </Button>
                );
              })}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddingMilestone((v) => !v)}
              >
                + Add
              </Button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, milestone: "" });
                  setAddingMilestone(false);
                }}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                None
              </button>
            </div>
            {addingMilestone && (
              <div className="mt-2 flex gap-2">
                <Input
                  id="f-milestone"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Milestone name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const n = newMilestone.trim();
                      if (!n) return;
                      setDraft({ ...draft, milestone: n });
                      setAddingMilestone(false);
                      setNewMilestone("");
                    }
                  }}
                  className="w-48"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const n = newMilestone.trim();
                    if (!n) return;
                    setDraft({ ...draft, milestone: n });
                    setAddingMilestone(false);
                    setNewMilestone("");
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </Field>
        )}

        <Button type="submit" disabled={!draft.title.trim()} className="self-start">
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
                  {todo.assignee && (
                    <span className="inline-flex items-center gap-1">
                      <Avatar name={todo.assignee} />
                      {todo.assignee}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-0.5 ${priorityMeta[todo.priority].badge}`}>
                    {(() => {
                      const Icon = priorityMeta[todo.priority].Icon;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {priorityMeta[todo.priority].label}
                  </span>
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

function Avatar({ name }: { name: string }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white ${colorForName(name)}`}
      title={name}
    >
      {initials(name) || "?"}
    </span>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default App;
