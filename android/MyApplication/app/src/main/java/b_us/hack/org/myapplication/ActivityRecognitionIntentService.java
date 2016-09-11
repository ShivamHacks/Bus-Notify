package b_us.hack.org.myapplication;

import android.app.IntentService;
import android.content.Intent;
import android.support.v4.content.LocalBroadcastManager;

import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;

/**
 * Service that receives ActivityRecognition updates. It receives updates
 * in the background, even if the main Activity is not visible.
 */
public class ActivityRecognitionIntentService extends IntentService {
    public ActivityRecognitionIntentService() {
        super("ActivityRecognizedService");
    }
    //..
    /**
     * Called when a new activity detection update is available.
     */
    @Override
    protected void onHandleIntent(Intent intent) {
        System.out.println(intent);
        //...
        // If the intent contains an update
        if (ActivityRecognitionResult.hasResult(intent)) {
            // Get the update
            ActivityRecognitionResult result =
                    ActivityRecognitionResult.extractResult(intent);

            DetectedActivity mostProbableActivity
                    = result.getMostProbableActivity();

            // Get the confidence % (probability)
            // Get the type
            int activityType = mostProbableActivity.getType();
           /* types:
            * DetectedActivity.IN_VEHICLE
            * DetectedActivity.ON_BICYCLE
            * DetectedActivity.ON_FOOT
            * DetectedActivity.STILL
            * DetectedActivity.UNKNOWN
            * DetectedActivity.TILTING
            */
            // process
            boolean driving=!(activityType==DetectedActivity.STILL)&&!(activityType==DetectedActivity.TILTING)&&!(activityType==DetectedActivity.UNKNOWN);
            System.out.println(activityType);
            Intent i=new Intent();
            System.out.println("It is driving? "+driving);
            i.setAction("b_us.hack.org.myapplication.BROADCAST");
            i.putExtra("data",driving);
            sendBroadcast(i);
        }
    }
}