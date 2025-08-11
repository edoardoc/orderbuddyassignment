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

            Context context = getContext();
            StarPrinterManager starPrinterManager = new com.orderbuddy.starprinter.StarPrinterManager(ip, context);
            starPrinterManager.print(payload.order, payload.restaurantInfo, payload.printerInfo);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to parse JSON using Moshi", e);
        }
    }
}
