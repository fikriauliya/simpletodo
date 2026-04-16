import { useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./index.css";

type Priority = "none" | "low" | "medium" | "high";

const PRIORITY_ORDER: Priority[] = ["none", "low", "medium", "high"];

const priorityColors: Record<Priority, { dot: string; label: string }> = {
  none: { dot: "bg-gray-200 border border-gray-400", label: "No priority" },
  low: { dot: "bg-emerald-500 border border-emerald-600", label: "Low priority" },
  medium: { dot: "bg-amber-500 border border-amber-600", label: "Medium priority" },
  high: { dot: "bg-red-500 border border-red-600", label: "High priority" },
};


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

const emptyDraft = {
  title: "",
  project: "",
  priority: "medium" as Priority,
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
  const [priorityOpenFor, setPriorityOpenFor] = useState<string | null>(null);
  const [projectOpenFor, setProjectOpenFor] = useState<string | null>(null);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const knownProjects = Array.from(new Set(todos.map((t) => t.project).filter(Boolean)));

  const setPriority = (id: string, p: Priority) => {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, priority: p } : x)));
    setPriorityOpenFor(null);
  };

  const setProjectFor = (ids: string[] | string, project: string) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setTodos((t) => t.map((x) => (idSet.has(x.id) ? { ...x, project } : x)));
    setProjectOpenFor(null);
    setNewProjectInput("");
    setBatchMoveOpen(false);
    if (Array.isArray(ids)) setSelected(new Set());
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const advance = (i: number) => setReached((r) => Math.max(r, i + 1));

  const addTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setTodos((t) => [...t, { id: uid(), done: false, subtasks: [], ...draft }]);
    setDraft(emptyDraft);
    setReached(0);
    setCustomDueOpen(false);
  };

  const toggleTodo = (id: string) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const deleteTodo = (id: string) => {
    setTodos((t) => t.filter((x) => x.id !== id));
    setSelected((s) => {
      if (!s.has(id)) return s;
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

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
                      advance(2);
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
                  advance(2);
                }}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                No one
              </button>
            </div>
          </Field>
        )}

        <Button type="submit" disabled={!draft.title.trim()} className="self-start">
          Add task
        </Button>
      </form>

      <ul className="group/list flex flex-col gap-2 pb-16">
        {todos.length === 0 && (
          <li className="text-sm text-muted-foreground">No tasks yet.</li>
        )}
        {todos.map((todo) => {
          const isSelected = selected.has(todo.id);
          return (
          <li key={todo.id} className={`group/item rounded border p-3 ${isSelected ? "bg-muted/50" : ""}`}>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(todo.id)}
                aria-label="Select task"
                title="Select for bulk actions"
                className={`mt-1.5 transition ${
                  isSelected || selected.size > 0
                    ? "opacity-100"
                    : "opacity-0 group-hover/item:opacity-100"
                }`}
              />
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.done ? "Mark not done" : "Mark done"}
                title={todo.done ? "Mark not done" : "Mark done"}
                className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  todo.done
                    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                    : "border-gray-400 hover:border-foreground"
                }`}
              >
                {todo.done && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(todo.id)}
                  className={`text-left font-medium ${todo.done ? "line-through text-muted-foreground" : ""}`}
                >
                  {todo.title}
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setPriorityOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      aria-expanded={priorityOpenFor === todo.id}
                      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition ${
                        todo.priority === "none"
                          ? "border border-dashed border-muted-foreground/40 hover:text-foreground"
                          : "bg-muted text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${priorityColors[todo.priority].dot}`}
                      />
                      {todo.priority === "none" ? "+ priority" : priorityColors[todo.priority].label.replace(" priority", "")}
                    </button>
                    {priorityOpenFor === todo.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setPriorityOpenFor(null)}
                        />
                        <div className="absolute left-0 top-7 z-20 flex items-center gap-2 rounded-md border bg-background p-2 shadow-md">
                          {PRIORITY_ORDER.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(todo.id, p)}
                              title={priorityColors[p].label}
                              aria-label={priorityColors[p].label}
                              className={`inline-block h-4 w-4 shrink-0 cursor-pointer rounded-full transition hover:scale-110 ${priorityColors[p].dot} ${
                                todo.priority === p ? "ring-2 ring-foreground ring-offset-1" : ""
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setProjectOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      className={`rounded px-1.5 py-0.5 transition ${
                        todo.project
                          ? "bg-muted text-foreground hover:bg-muted/70"
                          : "border border-dashed border-muted-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {todo.project || "+ project"}
                    </button>
                    {projectOpenFor === todo.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => {
                            setProjectOpenFor(null);
                            setNewProjectInput("");
                          }}
                        />
                        <div className="absolute left-0 top-7 z-20 flex w-56 flex-col gap-2 rounded-md border bg-background p-2 shadow-md">
                          {knownProjects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {knownProjects.map((p) => (
                                <Button
                                  key={p}
                                  type="button"
                                  size="sm"
                                  variant={todo.project === p ? "default" : "outline"}
                                  onClick={() => setProjectFor(todo.id, p)}
                                >
                                  {p}
                                </Button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <Input
                              value={newProjectInput}
                              onChange={(e) => setNewProjectInput(e.target.value)}
                              placeholder="New project"
                              className="h-8"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const n = newProjectInput.trim();
                                  if (n) setProjectFor(todo.id, n);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const n = newProjectInput.trim();
                                if (n) setProjectFor(todo.id, n);
                              }}
                              disabled={!newProjectInput.trim()}
                            >
                              Add
                            </Button>
                          </div>
                          {todo.project && (
                            <button
                              type="button"
                              onClick={() => setProjectFor(todo.id, "")}
                              className="text-left text-xs text-muted-foreground hover:text-foreground"
                            >
                              Remove from project
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {todo.assignee && (
                    <span className="inline-flex items-center gap-1">
                      <Avatar name={todo.assignee} />
                      {todo.assignee}
                    </span>
                  )}
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
          );
        })}
      </ul>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setBatchMoveOpen((v) => !v)}
            >
              Move to project…
            </Button>
            {batchMoveOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => {
                    setBatchMoveOpen(false);
                    setNewProjectInput("");
                  }}
                />
                <div className="absolute bottom-10 left-0 z-40 flex w-64 flex-col gap-2 rounded-md border bg-background p-2 shadow-md">
                  {knownProjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {knownProjects.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setProjectFor(Array.from(selected), p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Input
                      value={newProjectInput}
                      onChange={(e) => setNewProjectInput(e.target.value)}
                      placeholder="New project"
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const n = newProjectInput.trim();
                          if (n) setProjectFor(Array.from(selected), n);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const n = newProjectInput.trim();
                        if (n) setProjectFor(Array.from(selected), n);
                      }}
                      disabled={!newProjectInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjectFor(Array.from(selected), "")}
                    className="text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove from project
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}
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
