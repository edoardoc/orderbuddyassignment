package com.orderbuddy.starprinter;

import android.util.Base64;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

@CapacitorPlugin(name = "StarPrinter")
public class StarPrinterPlugin extends Plugin {

    @PluginMethod
    public void printOverNetwork(PluginCall call) {
        System.out.println("printing");

        String ip = call.getString("ip");
        String content = call.getString("content");

        if (ip == null) {
            call.reject("Missing IP");
            return;
        }

        if (content == null) {
            call.reject("Missing content");
            return;
        }

        try {
        
        byte[] payload = Base64.decode(content, Base64.DEFAULT);

        // Socket socket = new Socket();
        // socket.connect(new InetSocketAddress(ip, 9100), 2000);

        // OutputStream outputStream = socket.getOutputStream();
        // outputStream.write(payload);  // ✅ RAW BYTES sent to printer
        // outputStream.flush();
        // outputStream.close();
        // socket.close();

        new com.orderbuddy.printer.StarPrinter(ip).print(payload);
        call.resolve();
    } catch (Exception e) {
        call.reject("Print failed: " + e.getMessage());
    }
    }
}
