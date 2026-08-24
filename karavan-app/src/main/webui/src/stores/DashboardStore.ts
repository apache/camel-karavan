import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {Health, Metric} from "@models/DashboardModels";

interface MetricState {
    metrics: Metric[];
    setMetrics: (metrics: Metric[]) => void;
    updated: number;
}

export const useMetricStore = createWithEqualityFn<MetricState>((set) => ({
    metrics: [],
    updated: 0,
    setMetrics: (metrics: Metric[])  => {
        set((state: MetricState) => {
            state.metrics.length = 0;
            state.metrics.push(...metrics);
            return {metrics: state.metrics, updated: Math.random()};
        });
    },
}), shallow)

interface HealthState {
    healths: Health[];
    setHealths: (healths: Health[]) => void;
}

export const useHealthStore = createWithEqualityFn<HealthState>((set) => ({
    healths: [],
    setHealths: (healths: Health[])  => {
        set((state: HealthState) => {
            state.healths.length = 0;
            state.healths.push(...healths);
            return {healths: state.healths};
        });
    },
}), shallow)


export type DashboardSideBarType = 'integration' | 'openAPI' | 'library' | 'mcp'

interface DashboardState {
    showSideBar: DashboardSideBarType;
    setShowSideBar: (showSideBar: DashboardSideBarType, title?: string) => void;
    title: string;
    setTitle: (title: string) => void;
}

export const useDashboardStore = createWithEqualityFn<DashboardState>((set) => ({
    showSideBar: null,
    setShowSideBar: (showSideBar: DashboardSideBarType, title?: string) => {
        set({ showSideBar: showSideBar, title: title });
    },
    title: null,
    setTitle: (title: string) => {
        set({ title: title });
    },
}), shallow)


