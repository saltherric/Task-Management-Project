import React from 'react'

export default function TaskSmartPriority({
  score
}) {
  return (
    <div className="mt-8">

      <h3>Smart Priority</h3>

      <div>
        {score}/100
      </div>

    </div>
  );
}