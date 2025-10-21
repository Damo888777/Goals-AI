declare module 'react-native-userdefaults-ios' {
  interface UserDefaults {
    setStringForAppGroup(key: string, value: string, appGroup: string): Promise<void>
    getStringForAppGroup(key: string, appGroup: string): Promise<string | null>
    removeItemForAppGroup(key: string, appGroup: string): Promise<void>
  }
  
  const UserDefaults: UserDefaults
  export default UserDefaults
}
