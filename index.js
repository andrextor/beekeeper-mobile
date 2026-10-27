// NativeWind's runtime reads react-native's deprecated ImageBackground getter while it loads,
// before any app code can filter logs; the app never uses ImageBackground. Drop that notice.
if (__DEV__) {
  const warn = console.warn
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].startsWith('ImageBackground is deprecated')) return
    warn(...args)
  }
}

require('expo-router/entry')
