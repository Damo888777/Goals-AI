import { ConfigPlugin } from "@expo/config-plugins"
import { withWidgetIos } from "./ios/withWidgetIos"

export interface WithWidgetProps {
  devTeamId: string
}

const withWidget: ConfigPlugin<WithWidgetProps> = (config, options) => {
  config = withWidgetIos(config, options)
  return config
}

export default withWidget
