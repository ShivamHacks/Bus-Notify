package b_us.hack.org.myapplication;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

/**
 * A demo class that stores and retrieves data objects with each marker.
 */
public class MainActivity extends Activity {
    private static final String KEY = "8sklS F saf";
    private static final String LOC ="*(S  syf aouh" ;
    private boolean serviceStarted=false;
    private EditText editText;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.mainlayout);
        editText=((EditText) findViewById(R.id.route_id_input));
        editText.getBackground().setColorFilter(Color.parseColor("#43c4a9"), PorterDuff.Mode.SRC_IN);
        this.prefs=getSharedPreferences(KEY, Context.MODE_PRIVATE);
        String str=prefs.getString(LOC, null);
        if(str!=null){
            editText.setText(str);
        }
    }
    public void go(View v){
        //called when the button is clicked
        if(serviceStarted) {
            end();
        }else{
            Intent i = new Intent(this, Service.class);
            String code=editText.getText().toString();
            this.prefs.edit().putString(LOC,code).apply();
            if(code.length()==5&&allNum(code)) {
                startService(i,code);
            }else{
                invalidCode();
            }
        }
    }
    private void startService(Intent i,String code){
        i.putExtra("code", code);
        startService(i);
        Button toggle = (Button) findViewById(R.id.toggle);
        toggle.setText("End Route");
        this.serviceStarted = true;
    }
    private void invalidCode(){
        AlertDialog.Builder builder=new AlertDialog.Builder(this);
        builder.setTitle("Invalid code");
        builder.setMessage("Please re-enter your code.");
        builder.setPositiveButton("OK", null);
        builder.show();
    }
    private boolean allNum(String code) {
        for(int i=0;i<code.length();i++){
            if(!Character.isDigit(code.charAt(i))){
                return false;
            }
        }
        return true;
    }

    public void end(){
        stopService(new Intent(this, Service.class));
        //stopService(new Intent(Service.SERVICE_NAME));
        System.out.println("Service stopped");
        finish();
    }
    @Override
    public void onDestroy(){
        super.onDestroy();
    }

    public void newRoute(View view) {
        startActivity(new Intent(this,NewRouteActivity.class));
    }
}