stateDiagram-v2
    [*] --> pending_acceptance : Commander dispatches errand

    state pending_acceptance {
        [*] --> AwaitingRunnerAction
    }

    pending_acceptance --> active : Runner accepts
    pending_acceptance --> rejected : Runner rejects

    state active {
        [*] --> InProgress : Runner toggles isBought
    }

    active --> completed_by_runner : Runner submits completed checklist
    
    state completed_by_runner {
        [*] --> VerificationPending
    }

    completed_by_runner --> closed : Commander approves delivery

    rejected --> [*]
    closed --> [*]