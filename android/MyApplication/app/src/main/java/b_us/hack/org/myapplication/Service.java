package b_us.hack.org.myapplication;

import android.Manifest;
import android.app.IntentService;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.ActivityRecognition;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by frogn on 9/10/2016.
 */
public class Service extends IntentService implements GoogleApiClient.ConnectionCallbacks, GoogleApiClient.OnConnectionFailedListener {
    private GoogleApiClient mApiClient;
    private MyBTReceiver receiver;
    private boolean running=true;
    static final String SERVICE_NAME ="YdfDT SA *OD&POSF&";
    private boolean moving=false;

    public Service(){
        super(SERVICE_NAME);
        System.out.println("construct");
        Handler handler = new Handler(Looper.getMainLooper());
        handler.post(new Runnable() {
            @Override
            public void run() {
                IntentFilter filter = new IntentFilter("b_us.hack.org.myapplication.BROADCAST");
                Service.this.receiver = new MyBTReceiver(Service.this);
                registerReceiver(receiver, filter);
                Service.this.mApiClient = new GoogleApiClient.Builder(Service.this)
                        .addApi(ActivityRecognition.API)
                        .addConnectionCallbacks(Service.this)
                        .addOnConnectionFailedListener(Service.this)
                        .build();
                mApiClient.connect();
            }
        });
    }
    public void onDestroy(){
        System.out.println("OnDestroy");
        this.running=false;
        unregisterReceiver(receiver);
        this.stopSelf();
        super.onDestroy();
    }
    @Override
    protected void onHandleIntent(Intent workIntent) {
        // Gets data from the incoming Intent
        final String dataString = workIntent.getStringExtra("code");
        final LocationManager mLocationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        while(running){
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    // TODO: Consider calling
                    //    public void requestPermissions(@NonNull String[] permissions, int requestCode)
                    // here to request the missing permissions, and then overriding
                    //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
                    //                                          int[] grantResults)
                    // to handle the case where the user grants the permission. See the documentation
                    // for Activity#requestPermissions for more details.
                    return;
                }
            }
            final Location lastLoc = mLocationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
            double latititude = lastLoc.getLatitude();
            double longitude = lastLoc.getLongitude();
            try {
                Pinger.sendData(latititude, longitude, dataString, this.getApplicationContext(), moving);

            } catch (IOException e) {
                e.printStackTrace();
            }
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onConnected(Bundle bundle) {
        Intent intent = new Intent(Service.this, ActivityRecognitionIntentService.class);
        PendingIntent pendingIntent = PendingIntent.getService(Service.this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        ActivityRecognition.ActivityRecognitionApi.requestActivityUpdates(mApiClient, 3000, pendingIntent);
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {

    }

    public void letKnow(boolean data) {
        System.out.println("Has been notified");
        this.moving=data;
    }
}
