package com.orderbuddy.starprinter;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;

@CapacitorPlugin(name = "StarPrinter")
public class StarPrinterPlugin extends Plugin {

    @PluginMethod
    public void printOverNetwork(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("Missing data");
            return;
        }

        try {
            Moshi moshi = new Moshi.Builder().build();
            JsonAdapter<PrintPayload> adapter = moshi.adapter(PrintPayload.class);
            PrintPayload payload = adapter.fromJson(data);

            if (payload == null) {
                call.reject("Payload is null after parsing");
                return;
            }

            String ip = payload.printerInfo != null ? payload.printerInfo.ip : "unknown";
            Log.d("printer", ip);

            if (payload.order != null && payload.order._id != null) {
                if ("socket".equals(payload.source) && !PrintGuard.INSTANCE.tryPrint(payload.order._id)) {
                    call.resolve(); 
                    return;
                } else if ("manual".equals(payload.source)) {
                    Log.d("PrintGuard", "Manual print requested for order " + payload.order._id + ", allowing");
                }
            }
            Log.d("printing first", "print");
            Context context = getContext();
            StarPrinterManager starPrinterManager = new StarPrinterManager(ip, context);
            starPrinterManager.print(payload.order, payload.restaurantInfo, payload.printerInfo);// remove when production

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to parse JSON using Moshi", e);
            Log.d("PrintGuard", "PrintGuard failed" );

    PrintPayload payload = null;
    try {
        Moshi moshi = new Moshi.Builder().build();
        JsonAdapter<PrintPayload> adapter = moshi.adapter(PrintPayload.class);
        payload = adapter.fromJson(data);
        
        if (payload != null && payload.order != null && payload.order._id != null) {
            PrintGuard.INSTANCE.clear(payload.order._id);
            Log.d("PrintGuard", "Cleared failed print for order " + payload.order._id);
        }
    } catch (Exception parseEx) {
        Log.d("PrintGuard", "Failed to clear print guard due to parsing error");
    }
}
    }
}