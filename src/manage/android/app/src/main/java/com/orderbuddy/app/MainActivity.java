package com.orderbuddy.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.orderbuddy.starprinter.StarPrinterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StarPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
