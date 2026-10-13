type Priority = "critical" | "high" | "medium" | "low";

const SLA_HOURS: Record<Priority, number> = {
  critical: 2,
  low: 4,
  medium: 8,
  high: 24,
};

const calculateDueDate = (priority: Priority): Date => {
  const dueDate = new Date();

  dueDate.setHours(dueDate.getHours() + SLA_HOURS[priority]);

  return dueDate;
};

export { calculateDueDate };
