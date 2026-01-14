interface StatusStep {
  status: string;
  label: string;
  description: string;
}

const statusSteps: StatusStep[] = [
  { status: "OPEN", label: "Posted", description: "Job is accepting applications" },
  { status: "PENDING", label: "Assigned", description: "Cleaner assigned, awaiting start" },
  { status: "IN_PROGRESS", label: "In Progress", description: "Cleaner is working" },
  { status: "COMPLETED", label: "Completed", description: "Work finished, awaiting confirmation" },
  { status: "CONFIRMED", label: "Confirmed", description: "Client confirmed, awaiting payment" },
  { status: "PAID", label: "Paid", description: "Payment processed" },
];

const statusOrder = ["OPEN", "PENDING", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "PAID"];

interface JobStatusTimelineProps {
  currentStatus: string;
}

export function JobStatusTimeline({ currentStatus }: JobStatusTimelineProps) {
  // Handle special statuses
  if (currentStatus === "CANCELLED" || currentStatus === "DISPUTED") {
    return (
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              currentStatus === "CANCELLED" ? "bg-red-500" : "bg-orange-500"
            }`}
          />
          <span className="font-medium">
            {currentStatus === "CANCELLED" ? "Job Cancelled" : "Job Disputed"}
          </span>
        </div>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-1">
      {statusSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Status indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  isCompleted
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
              {index < statusSteps.length - 1 && (
                <div
                  className={`w-0.5 h-8 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Status content */}
            <div className={`pb-6 ${isPending ? "opacity-50" : ""}`}>
              <p
                className={`text-sm font-medium ${
                  isCurrent ? "text-blue-600" : ""
                }`}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Current
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
