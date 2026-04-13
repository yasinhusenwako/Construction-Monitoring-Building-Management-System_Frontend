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
import { useLanguage } from "../../context/LanguageContext";


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
    label: "submission",
    role: "user",
    icon: User,
    statuses: ["Submitted"],
  },

  {
    id: 1,
    label: "verification",
    role: "admin",
    icon: ShieldCheck,
    statuses: ["Under Review"],
  },

  {
    id: 2,
    label: "routing",
    role: "supervisor",
    icon: MapPin,
    statuses: ["Assigned to Supervisor", "WorkOrder Created"],
  },

  {
    id: 3,
    label: "execution",
    role: "professional",
    icon: Wrench,
    statuses: ["Assigned to Professional", "In Progress"],
  },

  {
    id: 4,
    label: "inspection",
    role: "supervisor",
    icon: ClipboardCheck,
    statuses: ["Completed"],
  },

  {
    id: 5,
    label: "approval",
    role: "admin",
    icon: CheckCircle,
    statuses: ["Reviewed", "Approved", "Rejected"],
  },

  {
    id: 6,
    label: "closed",
    role: "system",
    icon: Archive,
    statuses: ["Closed"],
  },

];

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ currentStatus }) => {
  const { t } = useLanguage();
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
                  <span className={`step-label ${isActive ? "active" : ""}`}>{t(`workflow.${step.label}`)}</span>
                  <span className="step-role">{t(`role.${step.role}`)}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
      
      {/* Current Status Badge for Mobile/Brief */}
      <div className="current-status-brief">
        <Clock size={14} className="text-[#1A3580] animate-pulse" />
        <span>{t("workflow.currently")}: <strong>{t(`status.${currentStatus.charAt(0).toLowerCase()}${currentStatus.slice(1).replace(/\s+/g, "")}` as any) || currentStatus}</strong></span>
      </div>

    </div>
  );
};
