import { ConfigPlugin } from "@expo/config-plugins"
import { withWidgetIos } from "./ios/withWidgetIos"

export interface WithWidgetProps {
  devTeamId: string
  appGroupId?: string  // App Group ID ist optional
}

const withWidget: ConfigPlugin<WithWidgetProps> = (config, options) => {
  // Wenn keine appGroupId angegeben, generiere eine basierend auf Bundle ID
  const enhancedOptions: WithWidgetProps = {
    ...options,
    appGroupId: options.appGroupId || `group.${config.ios?.bundleIdentifier || "com.example"}.widgetextension`
  }
  
  config = withWidgetIos(config, enhancedOptions)
  return config
}

export default withWidget