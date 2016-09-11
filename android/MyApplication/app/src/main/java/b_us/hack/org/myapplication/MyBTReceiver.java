package b_us.hack.org.myapplication;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Created by frogn on 9/10/2016.
 */
public class MyBTReceiver extends BroadcastReceiver{
    private final Service myService;

    public MyBTReceiver(Service myService){
        this.myService=myService;
    }
    @Override
    public void onReceive(Context context, Intent intent) {
        if(intent.getAction().equals("b_us.hack.org.myapplication.BROADCAST")){
            myService.letKnow(intent.getBooleanExtra("data",false));
        }
    }
}
