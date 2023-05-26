<?php
    include('./connection.php');
    if (isset($_GET['ten_vung'])){
        $txtmemo = $_GET['txtmemo'];
        $txtmemo = strtolower($txtmemo);
        $query = "select *, st_x(ST_Centroid(geom)) as x,st_y(ST_Centroid(geom)) as y from public.camhoangdc where LOWER(txtmemo) like '%$name%'";
        $result = pg_query($conn, $query);
        $tong_so_ket_qua = pg_num_rows($result);
        if($tong_so_ket_qua > 0){
            while($dong = pg_fetch_array($result, null, PGSQL_ASSOC)){
                $link = "<a href='javascript:void();' onclick='di_den_camhoangub(".$dong['x'].",".$dong['y'].")'>Click</a>";
                print("hien trang su dung: ".$dong['txtmemo']." | dien tich: ".$dong['shape_area']." ".$link."</br>");
            }
        }else{
            print("NOT FOUND");
        }
    }else{
        echo "NOT FOUND";
    }
?>