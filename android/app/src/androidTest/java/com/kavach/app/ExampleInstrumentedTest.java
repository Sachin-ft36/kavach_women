package com.kavach.app; // Unified to match your production ecosystem namespace

import static org.junit.Assert.*;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.List;

/**
 * Hardened Instrumented Tests for the Kavach Core Safety Grid.
 * These verify package integrity and native component presence at runtime.
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Retrieve the real native system target context under test
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        // Guard against package mismatch across build flavors
        assertEquals("Production package namespace mismatch detected!", 
                "com.kavach.app", appContext.getPackageName());
    }

    @Test
    public void verifyKavachServiceManifestRegistration() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        PackageManager packageManager = appContext.getPackageManager();
        
        // Construct explicit intent matching the core background safety service
        Intent serviceIntent = new Intent(appContext, KavachService.class);
        
        // Query manifest declarations to ensure the background component wasn't stripped by ProGuard/R8
        List<ResolveInfo> services = packageManager.queryIntentServices(serviceIntent, 0);
        
        assertNotNull("KavachService is not registered in the AndroidManifest.xml", services);
        assertFalse("KavachService manifest declaration is missing or unresolvable", services.isEmpty());
    }

    @Test
    public void verifyAccessibilityServiceManifestRegistration() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        PackageManager packageManager = appContext.getPackageManager();
        
        // Construct explicit intent matching your hardware key intercept layer
        Intent accessibilityIntent = new Intent(appContext, KavachAccessibilityService.class);
        
        List<ResolveInfo> services = packageManager.queryIntentServices(accessibilityIntent, 0);
        
        assertNotNull("KavachAccessibilityService is not registered in the AndroidManifest.xml", services);
        assertFalse("KavachAccessibilityService manifest declaration is missing", services.isEmpty());
    }
}
