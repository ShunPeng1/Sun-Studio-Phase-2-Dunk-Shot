import IState from "./IState"
import IStateTransitionData from "./IStateTransitionData"

interface IStateMementoStrategy {
    save(transitionState: IState, transitionData: IStateTransitionData | null): void;
    restore(isRemoveRestore?: boolean): [IState | null, IStateTransitionData | null];
}

export default IStateMementoStrategy