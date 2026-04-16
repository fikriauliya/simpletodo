import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import "./index.css";

type Priority = "none" | "low" | "medium" | "high";

const PRIORITY_ORDER: Priority[] = ["none", "low", "medium", "high"];

const priorityColors: Record<Priority, { dot: string; label: string }> = {
  none: { dot: "bg-gray-200 border border-gray-400", label: "No color" },
  low: { dot: "bg-emerald-500 border border-emerald-600", label: "Green" },
  medium: { dot: "bg-amber-500 border border-amber-600", label: "Amber" },
  high: { dot: "bg-red-500 border border-red-600", label: "Red" },
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
  milestone: string;
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
  milestone: "",
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

const chipClass = (filled: boolean) =>
  cn(
    "rounded px-1.5 py-0.5 transition",
    filled
      ? "bg-muted text-foreground hover:bg-muted/70"
      : "border border-dashed border-muted-foreground/40 hover:text-foreground",
  );

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [reached, setReached] = useState(0);
  const [customDueOpen, setCustomDueOpen] = useState(false);
  const [priorityOpenFor, setPriorityOpenFor] = useState<string | null>(null);
  const [projectOpenFor, setProjectOpenFor] = useState<string | null>(null);
  const [milestoneOpenFor, setMilestoneOpenFor] = useState<string | null>(null);
  const [subtasksOpenFor, setSubtasksOpenFor] = useState<string | null>(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [batchMoveOpen, setBatchMoveOpen] = useState<"project" | "milestone" | "priority" | null>(null);
  const [newProjectInput, setNewProjectInput] = useState("");
  const [newMilestoneInput, setNewMilestoneInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const knownProjects = useMemo(
    () => Array.from(new Set(todos.map((t) => t.project).filter(Boolean))),
    [todos],
  );
  const knownMilestones = useMemo(
    () => Array.from(new Set(todos.map((t) => t.milestone).filter(Boolean))),
    [todos],
  );
  const presets = useMemo(() => duePresets(), []);

  const setPriorityFor = (ids: string[] | string, p: Priority) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setTodos((t) => t.map((x) => (idSet.has(x.id) ? { ...x, priority: p } : x)));
    setPriorityOpenFor(null);
    setBatchMoveOpen(null);
  };

  const setProjectFor = (ids: string[] | string, project: string) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setTodos((t) => t.map((x) => (idSet.has(x.id) ? { ...x, project } : x)));
    setProjectOpenFor(null);
    setNewProjectInput("");
    setBatchMoveOpen(null);
  };

  const setMilestoneFor = (ids: string[] | string, milestone: string) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setTodos((t) => t.map((x) => (idSet.has(x.id) ? { ...x, milestone } : x)));
    setMilestoneOpenFor(null);
    setNewMilestoneInput("");
    setBatchMoveOpen(null);
  };

  const addSubtask = (todoId: string, title: string) => {
    const t = title.trim();
    if (!t) return;
    setTodos((list) =>
      list.map((x) =>
        x.id === todoId
          ? { ...x, subtasks: [...x.subtasks, { id: uid(), title: t, done: false }] }
          : x,
      ),
    );
    setNewSubtaskInput("");
  };

  const toggleSubtask = (todoId: string, subId: string) =>
    setTodos((list) =>
      list.map((x) =>
        x.id === todoId
          ? { ...x, subtasks: x.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
          : x,
      ),
    );

  const deleteSubtask = (todoId: string, subId: string) =>
    setTodos((list) =>
      list.map((x) =>
        x.id === todoId ? { ...x, subtasks: x.subtasks.filter((s) => s.id !== subId) } : x,
      ),
    );

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

  return (
    <div className="fixed inset-y-0 right-0 flex w-96 flex-col border-l bg-background shadow-xl">
      <div className="flex-1 overflow-y-auto p-4">
      <h1 className="mb-4 text-xl font-semibold">Simple Todo</h1>

      <form onSubmit={addTodo} className="mb-4 flex flex-col gap-3">
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
              {presets.map((p) => (
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

      <ul className="group/list flex flex-col gap-2">
        {todos.length === 0 && (
          <li className="text-sm text-muted-foreground">No tasks yet.</li>
        )}
        {todos.map((todo) => {
          const isSelected = selected.has(todo.id);
          return (
          <li
            key={todo.id}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;
              toggleSelect(todo.id);
            }}
            className={`cursor-pointer rounded border p-3 transition ${
              isSelected
                ? "border-primary bg-primary/10"
                : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-start gap-2">
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
                <div
                  className={`flex items-center gap-1.5 font-medium ${todo.done ? "line-through text-muted-foreground" : ""}`}
                >
                  <div className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() =>
                        setPriorityOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      aria-expanded={priorityOpenFor === todo.id}
                      aria-label={priorityColors[todo.priority].label}
                      title={priorityColors[todo.priority].label}
                      className={`inline-block h-3 w-3 shrink-0 cursor-pointer rounded-full transition hover:scale-110 ${priorityColors[todo.priority].dot}`}
                    />
                    <Popover
                      open={priorityOpenFor === todo.id}
                      onClose={() => setPriorityOpenFor(null)}
                      className="flex items-center gap-2"
                    >
                      <PriorityRow current={todo.priority} onPick={(p) => setPriorityFor(todo.id, p)} />
                    </Popover>
                  </div>
                  <span>{todo.title}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasksOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      className={chipClass(todo.subtasks.length > 0)}
                    >
                      {todo.subtasks.length > 0
                        ? `↳ ${todo.subtasks.filter((s) => s.done).length}/${todo.subtasks.length}`
                        : "+ subtask"}
                    </button>
                    <Popover
                      open={subtasksOpenFor === todo.id}
                      onClose={() => {
                        setSubtasksOpenFor(null);
                        setNewSubtaskInput("");
                      }}
                      className="flex w-60 flex-col gap-2"
                    >
                      {todo.subtasks.length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {todo.subtasks.map((s) => (
                            <li key={s.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={s.done}
                                onChange={() => toggleSubtask(todo.id, s.id)}
                              />
                              <span
                                className={cn("flex-1", s.done && "line-through text-muted-foreground")}
                              >
                                {s.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteSubtask(todo.id, s.id)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                                aria-label="Remove subtask"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-1">
                        <Input
                          value={newSubtaskInput}
                          onChange={(e) => setNewSubtaskInput(e.target.value)}
                          placeholder="New subtask"
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSubtask(todo.id, newSubtaskInput);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addSubtask(todo.id, newSubtaskInput)}
                          disabled={!newSubtaskInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </Popover>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setProjectOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      className={chipClass(!!todo.project)}
                    >
                      {todo.project || "+ project"}
                    </button>
                    <NamePicker
                      kind="project"
                      open={projectOpenFor === todo.id}
                      onClose={() => {
                        setProjectOpenFor(null);
                        setNewProjectInput("");
                      }}
                      known={knownProjects}
                      current={todo.project}
                      newInput={newProjectInput}
                      setNewInput={setNewProjectInput}
                      onPick={(v) => setProjectFor(todo.id, v)}
                    />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setMilestoneOpenFor((cur) => (cur === todo.id ? null : todo.id))
                      }
                      className={chipClass(!!todo.milestone)}
                    >
                      {todo.milestone ? `◎ ${todo.milestone}` : "+ milestone"}
                    </button>
                    <NamePicker
                      kind="milestone"
                      open={milestoneOpenFor === todo.id}
                      onClose={() => {
                        setMilestoneOpenFor(null);
                        setNewMilestoneInput("");
                      }}
                      known={knownMilestones}
                      current={todo.milestone}
                      newInput={newMilestoneInput}
                      setNewInput={setNewMilestoneInput}
                      onPick={(v) => setMilestoneFor(todo.id, v)}
                    />
                  </div>
                  {todo.assignee && (
                    <span className="inline-flex items-center gap-1">
                      <Avatar name={todo.assignee} />
                      {todo.assignee}
                    </span>
                  )}
                  {todo.endDate && <span>end: {todo.endDate}</span>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTodo(todo.id)}
                aria-label="Delete task"
                title="Delete task"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

          </li>
          );
        })}
      </ul>

      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-background px-3 py-2 text-sm">
          <div className="relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setBatchMoveOpen((v) => (v === "priority" ? null : "priority"))
              }
            >
              Set priority…
            </Button>
            <Popover
              open={batchMoveOpen === "priority"}
              onClose={() => setBatchMoveOpen(null)}
              anchor="top"
              className="flex items-center gap-2"
            >
              <PriorityRow current="none" onPick={(p) => setPriorityFor(Array.from(selected), p)} />
            </Popover>
          </div>
          <div className="relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setBatchMoveOpen((v) => (v === "project" ? null : "project"))}
            >
              Move to project…
            </Button>
            <NamePicker
              kind="project"
              open={batchMoveOpen === "project"}
              onClose={() => {
                setBatchMoveOpen(null);
                setNewProjectInput("");
              }}
              known={knownProjects}
              newInput={newProjectInput}
              setNewInput={setNewProjectInput}
              onPick={(v) => setProjectFor(Array.from(selected), v)}
              anchor="top"
            />
          </div>
          <div className="relative">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setBatchMoveOpen((v) => (v === "milestone" ? null : "milestone"))}
            >
              Set milestone…
            </Button>
            <NamePicker
              kind="milestone"
              open={batchMoveOpen === "milestone"}
              onClose={() => {
                setBatchMoveOpen(null);
                setNewMilestoneInput("");
              }}
              known={knownMilestones}
              newInput={newMilestoneInput}
              setNewInput={setNewMilestoneInput}
              onPick={(v) => setMilestoneFor(Array.from(selected), v)}
              anchor="top"
            />
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

function PriorityRow({
  current,
  onPick,
}: {
  current: Priority;
  onPick: (p: Priority) => void;
}) {
  return (
    <>
      {PRIORITY_ORDER.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPick(p)}
          title={priorityColors[p].label}
          aria-label={priorityColors[p].label}
          className={cn(
            "inline-block h-4 w-4 shrink-0 cursor-pointer rounded-full transition hover:scale-110",
            priorityColors[p].dot,
            current === p && "ring-2 ring-foreground ring-offset-1",
          )}
        />
      ))}
    </>
  );
}

function Popover({
  open,
  onClose,
  anchor = "bottom",
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchor?: "top" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className={cn(
          "absolute left-0 z-20 rounded-md border bg-background p-2 shadow-md",
          anchor === "top" ? "bottom-10" : "top-7",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

function NamePicker({
  kind,
  open,
  onClose,
  known,
  current,
  newInput,
  setNewInput,
  onPick,
  anchor = "bottom",
}: {
  kind: "project" | "milestone";
  open: boolean;
  onClose: () => void;
  known: string[];
  current?: string;
  newInput: string;
  setNewInput: (v: string) => void;
  onPick: (v: string) => void;
  anchor?: "top" | "bottom";
}) {
  const submit = () => {
    const n = newInput.trim();
    if (n) onPick(n);
  };
  return (
    <Popover open={open} onClose={onClose} anchor={anchor} className="flex w-64 flex-col gap-2">
      {known.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {known.map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={current === v ? "default" : "outline"}
              onClick={() => onPick(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <Input
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder={`New ${kind}`}
          className="h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="button" size="sm" onClick={submit} disabled={!newInput.trim()}>
          Add
        </Button>
      </div>
      {current && (
        <button
          type="button"
          onClick={() => onPick("")}
          className="text-left text-xs text-muted-foreground hover:text-foreground"
        >
          Remove {kind}
        </button>
      )}
    </Popover>
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
