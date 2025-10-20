import { ConfigPlugin } from "@expo/config-plugins";
export interface WithWidgetProps {
    devTeamId: string;
    appGroupId?: string;
}
/**
 * Expo Config Plugin zum Einrichten eines Widget Targets mit App Group Support.
 */
declare const withWidget: ConfigPlugin<WithWidgetProps>;
export default withWidget;
//# sourceMappingURL=index.d.ts.map