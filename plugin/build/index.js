"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withWidgetIos_1 = require("./ios/withWidgetIos");
const withWidget = (config, options) => {
    config = (0, withWidgetIos_1.withWidgetIos)(config, options);
    return config;
};
exports.default = withWidget;
//# sourceMappingURL=index.js.map