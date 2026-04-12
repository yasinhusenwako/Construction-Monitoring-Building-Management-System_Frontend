import React from "react";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Wrench, 
  ClipboardCheck, 
  CheckCircle, 
  Archive,
  Clock
} from "lucide-react";
import { WorkflowStatus } from "../../lib/workflow";
import "./WorkflowVisualizer.css";

interface WorkflowVisualizerProps {
  currentStatus: WorkflowStatus;
}

interface Step {
  id: number;
  label: string;
  role: string;
  icon: React.ElementType;
  statuses: WorkflowStatus[];
}

const steps: Step[] = [
  {
    id: 0,
    label: "Submission",
    role: "User",
    icon: User,
    statuses: ["Submitted"],
  },
  {
    id: 1,
    label: "Verification",
    role: "Admin",
    icon: ShieldCheck,
    statuses: ["Under Review"],
  },
  {
    id: 2,
    label: "Routing",
    role: "Supervisor",
    icon: MapPin,
    statuses: ["Assigned to Supervisor", "WorkOrder Created"],
  },
  {
    id: 3,
    label: "Execution",
    role: "Professional",
    icon: Wrench,
    statuses: ["Assigned to Professional", "In Progress"],
  },
  {
    id: 4,
    label: "Inspection",
    role: "Supervisor",
    icon: ClipboardCheck,
    statuses: ["Completed"],
  },
  {
    id: 5,
    label: "Approval",
    role: "Admin",
    icon: CheckCircle,
    statuses: ["Reviewed", "Approved", "Rejected"],
  },
  {
    id: 6,
    label: "Closed",
    role: "System",
    icon: Archive,
    statuses: ["Closed"],
  },
];

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ currentStatus }) => {
  const currentStepIndex = steps.findIndex((step) => 
    step.statuses.includes(currentStatus)
  );

  return (
    <div className="workflow-container">
      <div className="workflow-steps">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="workflow-step-wrapper">
              <div className="workflow-step">
                {/* Connector Line */}
                {index > 0 && (
                  <div 
                    className={`workflow-connector ${isCompleted || isActive ? "completed" : ""}`}
                  />
                )}

                {/* Step Node */}
                <div className={`workflow-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${isUpcoming ? "upcoming" : ""}`}>
                  <div className="node-icon-wrapper">
                    <Icon className="node-icon" size={20} />
                    {isActive && <div className="node-pulse" />}
                  </div>
                  
                  {isCompleted && (
                    <div className="node-checkmark">
                      <CheckCircle size={10} fill="white" stroke="white" />
                    </div>
                  )}
                </div>

                {/* Step Info */}
                <div className="step-info">
                  <span className={`step-label ${isActive ? "active" : ""}`}>{step.label}</span>
                  <span className="step-role">{step.role}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Current Status Badge for Mobile/Brief */}
      <div className="current-status-brief">
        <Clock size={14} className="text-[#1A3580] animate-pulse" />
        <span>Currently: <strong>{currentStatus}</strong></span>
      </div>
    </div>
  );
};
