package com.orderbuddy.starprinter;
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
        Log.d("StarPrinter", "printOverNetwork called");
    String data = call.getString("data");
    if (data == null) {
        call.reject("Missing data");
        return;
    }
        Log.d("StarPrinter", "data: " + data);

    try {
        Moshi moshi = new Moshi.Builder().build();
        JsonAdapter<PrintPayload> adapter = moshi.adapter(PrintPayload.class);
        PrintPayload payload = adapter.fromJson(data);

        if (payload == null) {
            call.reject("Payload is null after parsing");
            return;
        }
        Log.d("StarPrinter", "Parsed payload: " + payload.toString());
        Log.d("StarPrinter", "Parsed payload all: " + moshi.adapter(PrintPayload.class).toJson(payload));

        String ip = payload.printerInfo != null ? payload.printerInfo.ip : "unknown";
        Object orderId = payload.order != null ? payload.order._id : null;

        Log.d("StarPrinter", "IP: " + ip);
        Log.d("StarPrinter", "Order ID: " + orderId);
//         new com.orderbuddy.starprinter.StarPrinter(ip).print(payload);

        call.resolve();
    } catch (Exception e) {
        call.reject("Failed to parse JSON using Moshi", e);
    }
}
}
