package com.skillizee.zeeprep

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenSecurityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenSecurityModule"

    @ReactMethod
    fun allowScreenshots(allow: Boolean) {
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            if (allow) {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            } else {
                activity.window.setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
                )
            }
        }
    }
}
