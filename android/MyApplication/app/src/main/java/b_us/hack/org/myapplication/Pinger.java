package b_us.hack.org.myapplication;

import android.app.AlertDialog;
import android.content.Context;
import android.widget.Toast;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Created by frogn on 9/9/2016.
 */
public class Pinger {
    private final static String SERVER_DOMAIN="http://bus-notify.herokuapp.com/api/updateLocation";
    public static boolean sendData(double lat, double lng,String routeId,Context context,boolean driving) throws IOException {
        URL url=new URL(SERVER_DOMAIN+"?lng="+lng+"&lat="+lat+"&routeId="+routeId+"&driving="+driving);
        System.out.println("Driving: "+driving);
        if(driving){
            Toast.makeText(context,"Moving", Toast.LENGTH_SHORT).show();
        }else{
            Toast.makeText(context,"Not moving", Toast.LENGTH_SHORT).show();
        }
        System.out.println(url);
        HttpURLConnection connection=(HttpURLConnection)url.openConnection();
        connection.setConnectTimeout(3000);
        int deviation=Math.abs(connection.getResponseCode()-200);
        if(deviation<100){
            return true;
        }
        new AlertDialog.Builder(context).setTitle("No Internet connection").setMessage("Please connect to the internet.").setPositiveButton("OK",null).show();
        return false;
    }
}
